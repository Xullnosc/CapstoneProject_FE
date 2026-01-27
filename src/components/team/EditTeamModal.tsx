import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { teamService } from '../../services/teamService';
import type { Team, UpdateTeamRequest } from '../../types/team';

interface EditTeamModalProps {
    isOpen: boolean;
    closeModal: () => void;
    team: Team;
    onUpdateSuccess: () => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ isOpen, closeModal, team, onUpdateSuccess }) => {
    const [preview, setPreview] = useState<string | null>(team.teamAvatar || null);
    const [file, setFile] = useState<File | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateTeamRequest>({
        defaultValues: {
            teamName: team.teamName,
            description: team.description || '',
        }
    });

    // Reset form when team changes or modal opens
    useEffect(() => {
        reset({
            teamName: team.teamName,
            description: team.description || "",
        });
        setPreview(team.teamAvatar || null);
    }, [team, reset, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const onSubmit = async (data: UpdateTeamRequest) => {
        try {
            await teamService.updateTeam(team.teamId, {
                ...data,
                avatarFile: file || undefined
            });

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Team information updated successfully',
                confirmButtonColor: '#F26F21'
            });
            onUpdateSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update team information',
                confirmButtonColor: '#F26F21'
            });
        }
    };

    const onError = (errors: any) => {
        if (errors.description) {
            Swal.fire({
                icon: 'warning',
                title: 'Limit Exceeded',
                text: errors.description.message,
                confirmButtonColor: '#F26F21'
            });
        }
    };

    return (
        <Dialog
            visible={isOpen}
            onHide={closeModal}
            className="w-full max-w-lg"
            contentClassName="!rounded-2xl bg-white shadow-2xl border border-gray-100 [&::-webkit-scrollbar]:hidden"
            maskClassName="bg-black/40 backdrop-blur-sm z-[9999]"
            showHeader={false}
            modal
            dismissableMask
            draggable={false}
            resizable={false}
            style={{ overflow: 'hidden' }}
        >
            <div className="relative p-8 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Title */}
                <div className="text-center mb-8 mt-2">
                    <h3 className="text-3xl font-extrabold text-[#F26F21]">
                        Edit Team Info
                    </h3>
                    <div className="h-1 w-16 bg-orange-200 mx-auto mt-2 rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="relative size-28 rounded-full p-1 bg-white shadow-xl ring-4 ring-orange-50">
                                <img
                                    src={preview || "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png"}
                                    alt="Team Avatar"
                                    className="w-full h-full object-cover rounded-full border border-gray-100"
                                />
                            </div>
                            <label className="absolute bottom-1 right-1 bg-white text-gray-700 rounded-full p-1.5 shadow-lg cursor-pointer border border-gray-100 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1">
                                <span className="material-symbols-outlined text-sm font-bold flex items-center justify-center">camera_alt</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Change Avatar</span>
                    </div>

                    {/* Team Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Team Name</label>
                        <input
                            type="text"
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 sm:text-sm p-3 transition-all duration-200 font-medium"
                            placeholder="Enter team name"
                            {...register("teamName", { required: true, minLength: 3 })}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2 ml-1">
                            <label className="block text-sm font-bold text-gray-700">Description</label>
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Max 400 chars</span>
                        </div>
                        <textarea
                            rows={4}
                            className={`block w-full rounded-xl border bg-gray-50 focus:bg-white sm:text-sm p-3 transition-all duration-200 font-medium resize-none ${errors.description
                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                : 'border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                                }`}
                            placeholder="Tell us about your team..."
                            {...register("description", {
                                maxLength: {
                                    value: 400,
                                    message: "Description must be less than 400 characters."
                                }
                            })}
                        />
                        {errors.description && (
                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1 ml-1">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                            onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#F26F21] hover:bg-orange-700 transition-all duration-200 focus:ring-4 focus:ring-orange-500/20"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
};

export default EditTeamModal;
