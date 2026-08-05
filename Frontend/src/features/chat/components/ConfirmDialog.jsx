import React from "react";


const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    danger
}) => {
    if (!isOpen) return null

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <h3 className="confirm-dialog__title">{title}</h3>
                <p className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <button
                        className="confirm-dialog__btn confirm-dialog__btn--cancel"
                        onClick={onCancel}
                        type="button"
                    >
                        {cancelLabel || "Cancel"}
                    </button>
                    <button
                        className={`confirm-dialog__btn ${danger ? "confirm-dialog__btn--danger" : "confirm-dialog__btn--confirm"}`}
                        onClick={onConfirm}
                        type="button"
                    >
                        {confirmLabel || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    )
}


export default ConfirmDialog
