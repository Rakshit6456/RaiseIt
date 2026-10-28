import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mockState = {
  sessionCookie: "mock-session",
  tokenError: null,
  decoded: { uid: "student-1", email: "student@example.edu", role: "student", mustChangePassword: false, auth_time: Math.floor(Date.now() / 1000) },
  profile: { role: "student", active: true, email: "student@example.edu" },
  groqResult: {
    primaryFault: "Leaking tap", visibleEvidence: "Water is visible below the tap.", isUncertain: false,
    title: "Leaking tap", description: "Water is visible below the tap.", category: "plumbing",
    asset: "tap", severity: 2, priority: "Low", safetyConcern: false,
    confidence: null, reasoningSummary: "Visible water near a tap.",
  },
  groqError: null,
  groqCalls: 0,
  groqRequest: null,
  firebaseCalls: 0,
  writes: 0,
  collections: [],
};

class MockGroqRequestError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

const mocks = {
  "next/server": { NextResponse: { json: (body, options = {}) => {
    const response = Response.json(body, options);
    response.cookies = { set: (...args) => { mockState.cookieSet = args; } };
    return response;
  } } },
  "next/headers": { cookies: async () => ({ get: name => name === "__session" && mockState.sessionCookie ? { value: mockState.sessionCookie } : undefined }) },
  "server-only": {},
  "@/lib/firebase-admin": {
    adminAuth: {
      verifyIdToken: async () => {
        mockState.firebaseCalls++;
        if (mockState.tokenError) throw mockState.tokenError;
        return mockState.decoded;
      },
      verifySessionCookie: async () => {
        mockState.firebaseCalls++;
        if (mockState.tokenError) throw mockState.tokenError;
        return mockState.decoded;
      },
      setCustomUserClaims: async () => { mockState.claimsUpdated = true; },
      createSessionCookie: async () => "mock-session-cookie",
    },
    adminDb: {
      collection: name => {
        mockState.collections.push(name);
        return {
          doc: () => ({
            get: async () => ({ exists: Boolean(mockState.profile), data: () => mockState.profile }),
            update: async () => { mockState.writes++; },
          }),
          add: async () => { mockState.writes++; },
        };
      },
    },
  },
  "@/lib/groq": {
    GroqRequestError: MockGroqRequestError,
    requestGroqJson: async request => {
      mockState.groqCalls++;
      mockState.groqRequest = request;
      if (mockState.groqError) throw mockState.groqError;
      return mockState.groqResult;
    },
  },
  "cloudinary": { default: { uploader: { upload_stream: () => { throw new Error("Unexpected live upload"); } } } },
  "firebase-admin/firestore": { FieldValue: { arrayUnion: (...values) => values } },
};

function createContext() {
  return vm.createContext({
    Buffer, Request, Response, Headers, FormData, File, URL, console, process,
    setTimeout, clearTimeout, AbortController, TextEncoder, TextDecoder,
  });
}

async function loadModule(relativePath, context = createContext(), cache = new Map()) {
  const absolutePath = path.resolve(root, relativePath);
  const identifier = pathToFileURL(absolutePath).href;
  if (cache.has(identifier)) return cache.get(identifier);
  const source = await readFile(absolutePath, "utf8");
  const sourceModule = new vm.SourceTextModule(source, { context, identifier });
  cache.set(identifier, sourceModule);
  await sourceModule.link(async (specifier, referencingModule) => {
    if (Object.hasOwn(mocks, specifier)) {
      const mockId = `mock:${specifier}`;
      if (!cache.has(mockId)) {
        const mock = mocks[specifier];
        const synthetic = new vm.SyntheticModule(Object.keys(mock), function () {
          for (const [name, value] of Object.entries(mock)) this.setExport(name, value);
        }, { context, identifier: mockId });
        cache.set(mockId, synthetic);
      }
      return cache.get(mockId);
    }

    let target;
    if (specifier.startsWith("@/")) target = path.resolve(root, specifier.slice(2));
    else if (specifier.startsWith(".")) target = path.resolve(path.dirname(fileURLToPath(referencingModule.identifier)), specifier);
    else throw new Error(`Unmocked external import: ${specifier}`);
    if (!path.extname(target)) target += ".js";
    return loadModule(path.relative(root, target), context, cache);
  });
  await sourceModule.evaluate();
  return sourceModule;
}

function resetMocks() {
  mockState.sessionCookie = "mock-session";
  mockState.tokenError = null;
  mockState.decoded = { uid: "student-1", email: "student@example.edu", role: "student", mustChangePassword: false, auth_time: Math.floor(Date.now() / 1000) };
  mockState.profile = { role: "student", active: true, email: "student@example.edu" };
  mockState.groqError = null;
  mockState.groqCalls = 0;
  mockState.groqRequest = null;
  mockState.firebaseCalls = 0;
  mockState.writes = 0;
  mockState.collections = [];
  mockState.claimsUpdated = false;
  mockState.cookieSet = null;
  mockState.groqResult = {
    primaryFault: "Leaking tap", visibleEvidence: "Water is visible below the tap.", isUncertain: false,
    title: "Leaking tap", description: "Water is visible below the tap.", category: "plumbing",
    asset: "tap", severity: 2, priority: "Low", safetyConcern: false,
    confidence: null, reasoningSummary: "Visible water near a tap.",
  };
}

beforeEach(resetMocks);

test("image validation accepts supported JPEG, PNG, and WebP signatures", async () => {
  const { namespace } = await loadModule("lib/image-validation.js");
  const examples = [
    ["image/jpeg", [0xff, 0xd8, 0xff]],
    ["image/png", [137, 80, 78, 71, 13, 10, 26, 10]],
    ["image/webp", [...Buffer.from("RIFF0000WEBP")]],
  ];
  for (const [type, bytes] of examples) {
    const result = await namespace.readValidatedImage(new File([Buffer.from(bytes)], "test", { type }));
    assert.equal(result.mimeType, type);
    assert.equal(result.error, undefined);
  }
});

test("image validation rejects unsupported MIME, signature mismatch, empty data, and images over 5 MiB", async () => {
  const { namespace } = await loadModule("lib/image-validation.js");
  const unsupported = await namespace.readValidatedImage(new File(["x"], "x.gif", { type: "image/gif" }));
  const mismatch = await namespace.readValidatedImage(new File(["not png"], "x.png", { type: "image/png" }));
  const empty = await namespace.readValidatedImage(new File([], "empty.png", { type: "image/png" }));
  const oversized = await namespace.readValidatedImage(new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }));
  assert.match(unsupported.error, /JPEG, PNG, or WebP/);
  assert.match(mismatch.error, /contents do not match/);
  assert.match(empty.error, /non-empty/);
  assert.match(oversized.error, /5 MB or smaller/);
});

test("bounded body parsers reject malformed, declared-oversized, and streamed-oversized bodies", async () => {
  const { namespace } = await loadModule("lib/request-body.js");
  await assert.rejects(namespace.parseJsonLimited(new Request("http://local", { method: "POST", body: "{" }), 100), error => error.status === 400);
  await assert.rejects(namespace.parseJsonLimited(new Request("http://local", { method: "POST", headers: { "content-length": "101" }, body: "{}" }), 100), error => error.status === 413);
  const request = new Request("http://local", { method: "POST", body: "12345" });
  await assert.rejects(namespace.parseJsonLimited(request, 4), error => error.status === 413);
});

test("server authentication rejects missing and invalid/expired session cookies", async () => {
  const { namespace } = await loadModule("lib/server-auth.js");
  mockState.sessionCookie = null;
  await assert.rejects(namespace.requireUser(new Request("http://local"), { roles: ["student"] }), error => error.status === 401);
  assert.equal(mockState.firebaseCalls, 0);

  mockState.tokenError = new Error("invalid or expired token");
  await assert.rejects(namespace.requireUser(new Request("http://local"), { roles: ["student"] }), error => error.status === 401);
});

test("student is authenticated but rejected from admin authorization", async () => {
  const { namespace } = await loadModule("lib/server-auth.js");
  await assert.rejects(namespace.requireUser(new Request("http://local"), { roles: ["admin"] }), error => error.status === 403);
});

test("session creation refuses a forged profile role or stale role claim", async () => {
  const { namespace } = await loadModule("app/api/auth/session/route.js");
  mockState.profile = { role: "admin", active: true };
  let response = await namespace.POST(new Request("http://local", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: "mock-id-token" }) }));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).needsRefresh, true);
  assert.equal(mockState.cookieSet, null);
  assert.equal(mockState.claimsUpdated, true);

  mockState.claimsUpdated = false;
  mockState.decoded = { uid: "student-1", email: "student@example.edu", role: "admin", mustChangePassword: false, auth_time: Math.floor(Date.now() / 1000) };
  mockState.profile = { role: "student", active: true };
  response = await namespace.POST(new Request("http://local", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: "mock-id-token" }) }));
  assert.equal(response.status, 409);
  assert.equal(mockState.cookieSet, null);
});

test("admin with active server session profile passes admin authorization", async () => {
  const { namespace } = await loadModule("lib/server-auth.js");
  mockState.decoded = { uid: "admin-1", email: "admin@example.edu", role: "admin", mustChangePassword: false };
  mockState.profile = { role: "admin", active: true };
  const result = await namespace.requireUser(new Request("http://local"), { roles: ["admin"] });
  assert.equal(result.role, "admin");
  assert.equal(result.uid, "admin-1");
});

function imageRequest({ auth = true, bytes = [137, 80, 78, 71, 13, 10, 26, 10] } = {}) {
  mockState.sessionCookie = auth ? "mock-session" : null;
  const form = new FormData();
  form.append("file", new File([Buffer.from(bytes)], "issue.png", { type: "image/png" }));
  return new Request("http://local/api/complaints/analyze", {
    method: "POST",
    body: form,
  });
}

test("analysis endpoint rejects missing authentication without calling Groq", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  mockState.groqError = new MockGroqRequestError("Provider unavailable.", 503);
  const response = await route.namespace.POST(imageRequest({ auth: false }));
  assert.equal(response.status, 401);
  assert.equal(mockState.groqCalls, 0);
});

test("analysis endpoint rejects invalid images before calling Groq", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  const response = await route.namespace.POST(imageRequest({ bytes: [1, 2, 3] }));
  assert.equal(response.status, 400);
  assert.equal(mockState.groqCalls, 0);
});

test("clear damaged-fan response is fault-focused, includes evidence, sends image content, and maps department", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  mockState.groqResult = {
    primaryFault: "Damaged ceiling fan", visibleEvidence: "One blade appears bent and the fan casing is visibly cracked.", isUncertain: false,
    title: "Damaged ceiling fan requiring inspection", description: "The ceiling fan appears damaged. Please inspect the fan and its mounting and electrical connections before further use.",
    category: "electrical", asset: "ceiling fan", severity: 4, priority: "High", safetyConcern: true,
    confidence: null, reasoningSummary: "Visible damage warrants qualified inspection.",
  };
  const response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 200);
  const { analysis } = await response.json();
  assert.equal(analysis.primaryFault, "Damaged ceiling fan");
  assert.match(analysis.visibleEvidence, /blade|casing/);
  assert.match(analysis.title, /ceiling fan/i);
  assert.equal(analysis.category, "electrical");
  assert.equal(analysis.recommendedDepartment, "Electrical Department");
  assert.equal(analysis.confidence, null);
  const imagePart = mockState.groqRequest.messages[1].content.find(part => part.type === "image_url");
  assert.match(imagePart.image_url.url, /^data:image\/png;base64,/);
});

test("generic scene-only response is rejected without a primary fault and evidence", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  mockState.groqResult = {
    isUncertain: false, title: "Wooden desks and floor object", description: "A room contains desks and a white object on the floor.",
    category: "infrastructure", asset: "desk", severity: 2, priority: "Low", safetyConcern: false,
    confidence: null, reasoningSummary: "Several objects are visible.",
  };
  const response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /usable report/);
});

test("department mapping uses existing options and leaves unsupported categories unset", async () => {
  const { namespace } = await loadModule("lib/complaint-options.js");
  const { COMPLAINT_AUTHORITIES, COMPLAINT_CATEGORIES, getAuthorityForCategory, isComplaintAuthority } = namespace;
  assert.ok(COMPLAINT_CATEGORIES.includes("electrical"));
  assert.deepEqual(Array.from(COMPLAINT_AUTHORITIES), ["Electrical Department", "Plumbing Department", "IT Department", "Hostel Warden", "Infrastructure Team", "Sanitation Team", "Security Office", "Library Administration", "Head of Department", "College Principal"]);
  assert.deepEqual(Array.from(COMPLAINT_CATEGORIES), ["electrical", "plumbing", "infrastructure", "sanitation", "it", "other"]);
  assert.equal(getAuthorityForCategory("electrical"), "Electrical Department");
  assert.equal(getAuthorityForCategory("infrastructure"), "Infrastructure Team");
  assert.equal(getAuthorityForCategory("other"), "");
  assert.equal(getAuthorityForCategory("unknown"), "");
  assert.equal(isComplaintAuthority("Not a department"), false);
});

test("ambiguous analysis leaves AI suggestions and department unset for manual reporting", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  mockState.groqResult = {
    primaryFault: null, visibleEvidence: null, isUncertain: true, title: null, description: null,
    category: null, asset: null, severity: 3, priority: "Medium", safetyConcern: false,
    confidence: null, reasoningSummary: "The image does not show a clearly identifiable fault.",
  };
  const response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 200);
  const { analysis } = await response.json();
  assert.equal(analysis.isUncertain, true);
  assert.equal(analysis.primaryFault, "");
  assert.equal(analysis.title, "");
  assert.equal(analysis.category, "");
  assert.equal(analysis.recommendedDepartment, "");
});

test("form allows manual department edits and no longer renders the safety checkbox", async () => {
  const source = await readFile(path.resolve(root, "components/forms/ReportIssueForm.js"), "utf8");
  assert.match(source, /setTaggedAuthority\(suggestion\.recommendedDepartment\)/);
  assert.match(source, /<Select value=\{taggedAuthority\} onValueChange=\{setTaggedAuthority\}>/);
  assert.match(source, /COMPLAINT_AUTHORITIES\.includes\(suggestion\.recommendedDepartment\)/);
  for (const authority of ["Electrical Department", "Plumbing Department", "IT Department", "Hostel Warden", "Infrastructure Team", "Sanitation Team", "Security Office", "Library Administration", "Head of Department", "College Principal"]) {
    assert.ok(source.includes(`value="${authority}"`), `expected the existing dropdown to include ${authority}`);
  }
  assert.match(source, /fetch\("\/api\/complaints"/);
  assert.match(source, /fetch\("\/api\/complaints\/analyze"/);
  assert.doesNotMatch(source, /getIdToken|Authorization: `Bearer/);
  assert.doesNotMatch(source, /Possible safety concern based on the photo/);
});

test("missing AI configuration/provider failure is returned as a safe service error", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  mockState.groqError = new MockGroqRequestError("AI analysis is not configured.", 503);
  const response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.match(body.message, /not configured/);
  assert.doesNotMatch(body.message, /key|token|credential|private/i);
});

test("Groq helper reports missing API configuration without making a network request", async () => {
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const { namespace } = await loadModule("lib/groq.js");
    await assert.rejects(namespace.requestGroqJson({ messages: [], responseSchema: { type: "object" } }), error => {
      assert.equal(error.status, 503);
      assert.match(error.message, /not configured/);
      return true;
    });
  } finally {
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  }
});

test("malformed provider response and invalid structured fields map to safe 502", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  mockState.groqError = new MockGroqRequestError("The AI service returned an unreadable response.", 502);
  let response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 502);

  mockState.groqError = null;
  mockState.groqResult = {
    primaryFault: "  leak  ", visibleEvidence: "Visible water", isUncertain: false,
    title: "  leak  ", description: "Visible water", category: "unrecognized", asset: null,
    severity: 99, priority: "urgent", safetyConcern: "yes", confidence: null, reasoningSummary: "Visible water",
  };
  response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /usable report/);
});

test("successful analysis has no persistence imports or write side effects", async () => {
  const route = await loadModule("app/api/complaints/analyze/route.js");
  const response = await route.namespace.POST(imageRequest());
  assert.equal(response.status, 200);
  assert.equal(mockState.writes, 0);
  assert.equal(mockState.groqCalls, 1);
  assert.equal(mockState.firebaseCalls, 1);
  assert.deepEqual(mockState.collections, ["users"]);
});
