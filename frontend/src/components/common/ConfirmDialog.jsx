import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn btn-danger' : 'btn btn-primary'}>{confirmLabel}</button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
          <ExclamationTriangleIcon className={`h-5 w-5 ${danger ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
        <p className="text-sm text-slate-600 pt-2">{message}</p>
      </div>
    </Modal>
  );
}
