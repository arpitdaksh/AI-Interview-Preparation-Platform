import React from "react";


const SkeletonLine = ({ width = "100%" }) => (
    <div className="skeleton-line" style={{ width }} />
)


const ChatSkeleton = () => {
    return (
        <div className="chat-skeleton" aria-label="Loading chat">
            <div className="chat-skeleton__messages">
                <div className="chat-skeleton__row chat-skeleton__row--assistant">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-content">
                        <SkeletonLine width="75%" />
                        <SkeletonLine width="50%" />
                        <SkeletonLine width="60%" />
                    </div>
                </div>
                <div className="chat-skeleton__row chat-skeleton__row--user">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-content">
                        <SkeletonLine width="60%" />
                    </div>
                </div>
                <div className="chat-skeleton__row chat-skeleton__row--assistant">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-content">
                        <SkeletonLine width="85%" />
                        <SkeletonLine width="55%" />
                        <SkeletonLine width="70%" />
                        <SkeletonLine width="40%" />
                    </div>
                </div>
            </div>
        </div>
    )
}


export default ChatSkeleton
