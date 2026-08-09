'use server'

import { db } from "@/lib/firebase"
import cloudinary from "@/lib/cloudinary"
import { collection, addDoc } from "firebase/firestore"
import { redirect } from "next/navigation"

export async function submitComplaint(prevState, formData) {
    const title = formData.get("title")
    const description = formData.get("description")
    const category = formData.get("category")
    const location = formData.get("location")
    const isAnonymous = formData.get("isAnonymous") === "on"
    const imageFile = formData.get("image")

    let imageUrl = null

    try {
        if (!db) {
            return { message: "Database not initialized", success: false }
        }

        // Upload image to Cloudinary if provided
        if (imageFile && imageFile.size > 0) {
            const arrayBuffer = await imageFile.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Upload to Cloudinary using a promise wrapper since verify doesn't support awaiting streams directly easily
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "infratrack-complaints" },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                ).end(buffer)
            })

            imageUrl = uploadResult.secure_url
        }

        // Create complaint document
        await addDoc(collection(db, "complaints"), {
            title,
            description,
            category,
            location,
            isAnonymous,
            imageUrl,
            status: "Pending",
            upvotes: 0,
            createdAt: new Date().toISOString(),
            // In a real app, you would get the user ID from the session here
            userId: "temp-user-id",
            userName: isAnonymous ? "Anonymous" : "John Doe" // Placeholder
        })

    } catch (error) {
        console.error("Detailed Submission Error:", error)
        
        if (error.code === 'permission-denied' || error.message.includes('7 PERMISSION_DENIED')) {
            return { 
                message: "Database Permission Denied. Please ensure Firestore Security Rules are updated.", 
                success: false,
                errorType: "PERMISSION_DENIED" 
            }
        }
        
        return { message: "Failed to submit complaint. Please check your connection and try again.", success: false }
    }

    redirect("/student/dashboard?success=true")
}

export async function resolveComplaint(complaintId) {
    const { doc, updateDoc } = await import("firebase/firestore")
    
    try {
        if (!db) {
            throw new Error("Database not initialized")
        }

        const complaintRef = doc(db, "complaints", complaintId)
        await updateDoc(complaintRef, {
            status: "Resolved",
            resolvedAt: new Date().toISOString()
        })

        return { success: true, message: "Complaint resolved successfully" }
    } catch (error) {
        console.error("Resolve error:", error)
        return { success: false, message: "Failed to resolve complaint" }
    }
}

