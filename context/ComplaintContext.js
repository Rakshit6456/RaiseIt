"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"

import { db } from "@/lib/firebase"
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    addDoc,
    serverTimestamp
} from "firebase/firestore"

const ComplaintContext = createContext()

export function ComplaintProvider({ children }) {
    const [complaints, setComplaints] = useState([])
    const [loading, setLoading] = useState(true)

    // Real-time Fetch from Firestore
    useEffect(() => {
        if (!db) {
            console.warn("Firestore not initialized");
            setLoading(false);
            return;
        }
        const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const complaintsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamps to serializable dates (if needed) or keep as is.
                // For simple display, we might want to convert date strings.
                // serverTimestamp is null on immediate write, so we handle that.
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
            }))
            setComplaints(complaintsData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching complaints:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Add Complaint (Helper - though ReportIssueForm does this directly usually)
    const addComplaint = async (newComplaint) => {
        if (!db) return Promise.reject(new Error("Firestore not initialized"));
        try {
            await addDoc(collection(db, "complaints"), {
                ...newComplaint,
                status: "Pending",
                createdAt: serverTimestamp(),
                timeline: [
                    {
                        title: "Complaint Reported",
                        date: new Date().toISOString().split('T')[0], // Store as ISO string or timestamp
                        description: "Issue submitted.",
                        status: "done",
                        timestamp: new Date()
                    }
                ],
                comments: []
            })
        } catch (error) {
            console.error("Error adding complaint:", error)
            throw error
        }
    }

    const updateStatus = async (id, status, notes = "") => {
        if (!db) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            const timestamp = new Date().toISOString().split('T')[0] // Use consistent format

            let timelineEvent = {
                date: timestamp,
                status: "done",
                timestamp: new Date()
            }

            if (status === 'In Progress') {
                timelineEvent.title = "In Progress"
                timelineEvent.description = "Status changed to In Progress."
            } else if (status === 'Resolved') {
                timelineEvent.title = "Issue Resolved"
                timelineEvent.description = notes || "Issue fixed."
            } else if (status === 'Rejected') {
                timelineEvent.title = "Complaint Rejected"
                timelineEvent.description = notes || "Issue rejected."
            } else if (status === 'Closed') {
                timelineEvent.title = "Closed"
                timelineEvent.description = "Ticket closed."
            } else {
                timelineEvent.title = "Status Updated"
                timelineEvent.description = `Status changed to ${status}.`
            }

            await updateDoc(complaintRef, {
                status,
                resolutionNotes: notes,
                timeline: arrayUnion(timelineEvent)
            })
        } catch (error) {
            console.error("Error updating status:", error)
        }
    }

    const updatePriority = async (id, priority) => {
        if (!db) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            const timestamp = new Date().toISOString().split('T')[0]

            await updateDoc(complaintRef, {
                priority,
                timeline: arrayUnion({
                    title: "Priority Updated",
                    date: timestamp,
                    description: `Priority changed to ${priority}.`,
                    status: "done",
                    timestamp: new Date()
                })
            })
        } catch (error) {
            console.error("Error updating priority:", error)
        }
    }

    const addComment = async (id, author, text) => {
        if (!db) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            const timestamp = new Date().toISOString().split('T')[0]

            await updateDoc(complaintRef, {
                comments: arrayUnion({
                    author,
                    date: timestamp,
                    text,
                    timestamp: new Date()
                })
            })
        } catch (error) {
            console.error("Error adding comment:", error)
        }
    }

    const updateStage = async (id, stage) => {
        if (!db) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            const timestamp = new Date().toISOString().split('T')[0]

            await updateDoc(complaintRef, {
                stage,
                timeline: arrayUnion({
                    title: "Stage Updated",
                    date: timestamp,
                    description: `Stage changed to ${stage}.`,
                    status: "done",
                    timestamp: new Date()
                })
            })
        } catch (error) {
            console.error("Error updating stage:", error)
        }
    }

    const addAdminComment = async (id, author, text) => {
        if (!db) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            const timestamp = new Date().toISOString().split('T')[0]

            await updateDoc(complaintRef, {
                adminComments: arrayUnion({
                    author,
                    date: timestamp,
                    text,
                    timestamp: new Date()
                })
            })
        } catch (error) {
            console.error("Error adding admin comment:", error)
        }
    }

    // Since we are not strictly using "addTimelineEvent" generically in the old code, 
    // we can keep a generic one too if needed.
    const addTimelineEvent = async (id, event) => {
        if (!db) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            await updateDoc(complaintRef, {
                timeline: arrayUnion({
                    ...event,
                    timestamp: new Date()
                })
            })
        } catch (error) {
            console.error("Error adding timeline event:", error)
        }
    }

    // Upvote a complaint (toggle: add if not voted, no-op if already voted)
    const upvoteComplaint = async (id, userId) => {
        if (!db || !userId) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            // arrayUnion won't add duplicate if already upvoted
            await updateDoc(complaintRef, {
                upvotes: arrayUnion(userId)
            })
        } catch (error) {
            console.error("Error upvoting complaint:", error)
        }
    }

    // Remove upvote
    const removeUpvote = async (id, userId) => {
        if (!db || !userId) return;
        try {
            const complaintRef = doc(db, "complaints", id)
            await updateDoc(complaintRef, {
                upvotes: arrayRemove(userId)
            })
        } catch (error) {
            console.error("Error removing upvote:", error)
        }
    }

    const submitFeedback = async (id, feedbackData) => {
        if (!db) return Promise.reject(new Error("Firestore not initialized"));
        try {
            const complaintRef = doc(db, "complaints", id)
            await updateDoc(complaintRef, {
                feedback: feedbackData
            })
        } catch (error) {
            console.error("Error submitting feedback:", error)
            throw error
        }
    }

    const { currentUser } = useAuth() || {}

    const getComplaint = (id) => complaints.find(c => c.id === id)

    return (
        <ComplaintContext.Provider value={{
            complaints,
            addComplaint,
            updateStatus,
            updatePriority,
            addComment,
            addTimelineEvent,
            submitFeedback,
            getComplaint,
            upvoteComplaint,
            removeUpvote,
            loading,
            updateStage,
            addAdminComment
        }}>
            {children}
        </ComplaintContext.Provider>
    )
}

export const useComplaints = () => useContext(ComplaintContext)
