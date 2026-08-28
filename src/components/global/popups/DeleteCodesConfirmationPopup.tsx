import React from 'react'
import PopupModal from './PopupModal';
import PopupBox from './PopupBox';
import { deleteCodesFromLocalStorage } from '../../../utils/localStorageHelper';
import { deleteAllCloudCodes } from '../../../utils/services/cloudCodeService';
import { useCFStore } from '../../../zustand/useCFStore';
import { toast } from 'sonner';

interface DeleteCodesConfirmationPopupProps {
    openConfirmationPopup: boolean;
    setOpenConfirmationPopup: (open: boolean) => void;
}

const DeleteCodesConfirmationPopup: React.FC<DeleteCodesConfirmationPopupProps> = ({
    openConfirmationPopup,
    setOpenConfirmationPopup
}) => {

    const isPlusUser = useCFStore((state) => state.isPlusUser);
    const isLoggedIn = useCFStore((state) => state.isLoggedIn);

    const deleteLocalCodes = () => {
        setOpenConfirmationPopup(false);
        deleteCodesFromLocalStorage();
    };

    const deleteCloudCodes = async () => {
        setOpenConfirmationPopup(false);
        if (isPlusUser && isLoggedIn) {
            const success = await deleteAllCloudCodes();
            if (success) {
                useCFStore.getState().setCloudCodeCount(0);
                toast.success("Cloud codes deleted successfully!");
            } else {
                toast.error("Failed to delete cloud codes! Please try again.");
            }
        }
    };

    const redButtonStyle = "w-full py-2.5 px-4 rounded-lg bg-white/50 dark:bg-[#2a2a2a]/50 backdrop-blur-sm border border-black/5 dark:border-white/10 text-red-500 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 flex justify-center items-center gap-2";

    return (
        <PopupModal isOpen={openConfirmationPopup} setIsOpen={setOpenConfirmationPopup}>
            <PopupBox isOpen={openConfirmationPopup} setIsOpen={setOpenConfirmationPopup} title="Delete Codes" customClass="w-[90%] md:w-[400px]" popupHeight="h-auto">
                <div
                    className={`text-gray-700 dark:text-darkText-400 z-20 opacity-100 bg-white rounded-md shadow-sm dark:bg-darkBox-900 mx-auto relative`}
                >
                    <p className="mt-2 text-sm text-gray-600 dark:text-darkText-300 mb-6">
                        Select which codes you want to delete. This action cannot be undone.
                    </p>

                    <div className="flex flex-col mt-4 space-y-3">
                        <button
                            onClick={deleteLocalCodes}
                            className={redButtonStyle}
                        >
                            Delete Local Codes
                        </button>
                        {isPlusUser && isLoggedIn && (
                            <button
                                onClick={deleteCloudCodes}
                                className={redButtonStyle}
                            >
                                Delete Cloud Codes
                            </button>
                        )}
                        <button
                            onClick={() => setOpenConfirmationPopup(false)}
                            className="w-full mt-2 px-4 py-2.5 text-sm text-gray-700 transition-colors duration-200 bg-gray-100 rounded-lg dark:text-darkText-400 dark:bg-darkBox-800 dark:hover:bg-gray-800 dark:border-darkBorder-700 dark:border hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </PopupBox>
        </PopupModal>
    )
}

export default DeleteCodesConfirmationPopup