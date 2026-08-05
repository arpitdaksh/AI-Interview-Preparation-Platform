import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import PageSkeleton from "./features/platform/components/PageSkeleton";

const ChatPage = lazy(() => import("./features/chat/pages/ChatPage"))
const PlatformLayout = lazy(() => import("./features/platform/components/PlatformLayout"))
const Dashboard = lazy(() => import("./features/platform/pages/Dashboard"))
const MockInterviewPage = lazy(() => import("./features/platform/pages/MockInterviewPage"))
const CodingInterviewPage = lazy(() => import("./features/platform/pages/CodingInterviewPage"))
const CareerRoadmapPage = lazy(() => import("./features/platform/pages/CareerRoadmapPage"))
const ResumeVersionsPage = lazy(() => import("./features/platform/pages/ResumeVersionsPage"))
const AnalyticsPage = lazy(() => import("./features/platform/pages/AnalyticsPage"))
const ProfilePage = lazy(() => import("./features/platform/pages/ProfilePage"))

const platformFallback = <div className="platform-loading">Loading...</div>
const pageFallback = <PageSkeleton />

const withPlatform = (page) => (
    <Suspense fallback={pageFallback}>
        {page}
    </Suspense>
)


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/chat",
        element: <Protected><Suspense fallback={<div className="chat-skeleton" />}><ChatPage /></Suspense></Protected>
    },
    {
        path: "/chat/:chatId",
        element: <Protected><Suspense fallback={<div className="chat-skeleton" />}><ChatPage /></Suspense></Protected>
    },
    {
        // Parent route renders the PlatformLayout (sidebar), nested children render in <Outlet />
        element: (
            <Protected>
                <Suspense fallback={platformFallback}>
                    <PlatformLayout />
                </Suspense>
            </Protected>
        ),
        children: [
            {
                path: "dashboard",
                element: withPlatform(<Dashboard />)
            },
            {
                path: "mock-interview",
                element: withPlatform(<MockInterviewPage />)
            },
            {
                path: "coding-interview",
                element: withPlatform(<CodingInterviewPage />)
            },
            {
                path: "roadmap",
                element: withPlatform(<CareerRoadmapPage />)
            },
            {
                path: "resumes",
                element: withPlatform(<ResumeVersionsPage />)
            },
            {
                path: "analytics",
                element: withPlatform(<AnalyticsPage />)
            },
            {
                path: "profile",
                element: withPlatform(<ProfilePage />)
            }
        ]
    }
])

