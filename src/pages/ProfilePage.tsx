
import { useEffect, useState, type FormEvent } from 'react'
import {
    Camera,
    Check,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    Mail,
    RefreshCw,
    ShieldCheck,
    UserRound,
} from 'lucide-react'
import { ApiError } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import {
    changeMyPassword,
    getMyProfile,
    updateMyProfile,
} from '../services/employee'
import type { Employee } from '../types/auth'
import './ProfilePage.css'
import { uploadProfileImage } from '../services/imageUpload'

function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 0) {
            return 'Unable to reach the server. Check your connection and try again.'
        }

        return error.message
    }

    return 'Something went wrong. Please try again.'
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase()
}

function isValidPhotoUrl(value: string): boolean {
    if (!value.trim()) return true

    try {
        const url = new URL(value)

        return (
            (url.protocol === 'https:' || url.protocol === 'http:') &&
            Boolean(url.hostname)
        )
    } catch {
        return false
    }
}

function formatRole(role: string): string {
    return role.toLowerCase() === 'hr' ? 'Human Resources' : 'Employee'
}

export function ProfilePage() {
    const { employee, updateEmployee } = useAuth()

    const [profile, setProfile] = useState<Employee | null>(employee)
    const [phoneNumber, setPhoneNumber] = useState(employee?.phoneNumber ?? '')
    const [photoUrl, setPhotoUrl] = useState(employee?.photoUrl ?? '')
    const [isLoading, setIsLoading] = useState(true)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [profileError, setProfileError] = useState('')
    const [profileSuccess, setProfileSuccess] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const [photoUploadError, setPhotoUploadError] = useState('')
    useEffect(() => {
        let cancelled = false

        async function loadProfile() {
            setIsLoading(true)
            setProfileError('')

            try {
                const result = await getMyProfile()

                if (!cancelled) {
                    setProfile(result)
                    setPhoneNumber(result.phoneNumber ?? '')
                    setPhotoUrl(result.photoUrl ?? '')
                    updateEmployee(result)
                }
            } catch (error) {
                if (!cancelled) {
                    setProfileError(getErrorMessage(error))
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        void loadProfile()

        return () => {
            cancelled = true
        }
    }, [updateEmployee])

    async function handlePhotoUpload(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0]

        // Allow selecting the same file again after an upload attempt.
        event.target.value = ''

        if (!file) return

        setPhotoUploadError('')
        setProfileError('')
        setProfileSuccess('')

        setIsUploadingPhoto(true)

        try {
            const uploadedUrl = await uploadProfileImage(file)

            // Stage the URL in the form; Save changes persists it to the backend.
            setPhotoUrl(uploadedUrl)
        } catch (error) {
            setPhotoUploadError(
                error instanceof Error
                    ? error.message
                    : 'Could not upload your image. Please try again.',
            )
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setProfileError('')
        setProfileSuccess('')

        const normalizedPhone = phoneNumber.trim()
        const normalizedPhotoUrl = photoUrl.trim()

        if (normalizedPhone.length > 30) {
            setProfileError('Phone number must be 30 characters or fewer.')
            return
        }

        if (!isValidPhotoUrl(normalizedPhotoUrl)) {
            setProfileError('Enter a valid photo URL beginning with http:// or https://.')
            return
        }

        if (normalizedPhotoUrl.length > 2048) {
            setProfileError('Photo URL must be 2048 characters or fewer.')
            return
        }

        const updates = {
            phoneNumber: normalizedPhone,
            photoUrl: normalizedPhotoUrl,
        }

        if (
            profile &&
            normalizedPhone === (profile.phoneNumber ?? '') &&
            normalizedPhotoUrl === (profile.photoUrl ?? '')
        ) {
            setProfileSuccess('Your profile is already up to date.')
            return
        }

        setIsSavingProfile(true)

        try {
            const updated = await updateMyProfile(updates)

            setProfile(updated)
            setPhoneNumber(updated.phoneNumber ?? '')
            setPhotoUrl(updated.photoUrl ?? '')
            updateEmployee(updated)
            setProfileSuccess('Your profile has been updated.')
        } catch (error) {
            setProfileError(getErrorMessage(error))
        } finally {
            setIsSavingProfile(false)
        }
    }

    async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')

        if (currentPassword.length < 8 || currentPassword.length > 72) {
            setPasswordError('Your current password must be between 8 and 72 characters.')
            return
        }

        if (newPassword.length < 8 || newPassword.length > 72) {
            setPasswordError('Your new password must be between 8 and 72 characters.')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('The new password and confirmation do not match.')
            return
        }

        if (currentPassword === newPassword) {
            setPasswordError('Your new password must be different from your current password.')
            return
        }

        setIsChangingPassword(true)

        try {
            await changeMyPassword({ currentPassword, newPassword })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordSuccess('Your password has been changed successfully.')
        } catch (error) {
            setPasswordError(getErrorMessage(error))
        } finally {
            setIsChangingPassword(false)
        }
    }

    const displayEmployee = profile ?? employee
    const displayName = displayEmployee?.fullName || 'Employee'
    const initials = getInitials(displayName)

    if (isLoading && !displayEmployee) {
        return (
            <section className="profile-page">
                <div className="profile-loading">
                    <LoaderCircle size={22} className="profile-spinner" />
                    <p>Loading your profile...</p>
                </div>
            </section>
        )
    }

    return (
        <section className="profile-page">
            <div className="section-heading profile-heading">
                <div>
                    <p className="eyebrow">YOUR ACCOUNT</p>
                    <h2>My Profile</h2>
                    <p className="profile-subtitle">
                        Manage your personal information and account security.
                    </p>
                </div>

                <button
                    className="profile-refresh-button"
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                        setIsLoading(true)
                        setProfileError('')
                        void getMyProfile()
                            .then((result) => {
                                setProfile(result)
                                setPhoneNumber(result.phoneNumber ?? '')
                                setPhotoUrl(result.photoUrl ?? '')
                                updateEmployee(result)
                            })
                            .catch((error: unknown) => {
                                setProfileError(getErrorMessage(error))
                            })
                            .finally(() => setIsLoading(false))
                    }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {profileError && (
                <div className="profile-alert profile-alert-error" role="alert">
                    <span>{profileError}</span>
                </div>
            )}

            <div className="profile-overview">
                <div className="profile-avatar">
                    {displayEmployee?.photoUrl ? (
                        <img
                            src={displayEmployee.photoUrl}
                            alt={`${displayName}'s profile`}
                            onError={(event) => {
                                event.currentTarget.style.display = 'none'
                            }}
                        />
                    ) : (
                        <span>{initials || 'E'}</span>
                    )}
                </div>

                <div className="profile-overview-info">
                    <h3>{displayName}</h3>
                    <p>{displayEmployee?.position || 'Position not set'}</p>
                    <span className="profile-role">
                        <ShieldCheck size={14} />
                        {formatRole(displayEmployee?.role ?? 'EMPLOYEE')}
                    </span>
                </div>

                <div className="profile-overview-email">
                    <span className="profile-icon-box">
                        <Mail size={18} />
                    </span>
                    <div>
                        <span className="profile-meta-label">Company email</span>
                        <strong>{displayEmployee?.companyEmail ?? '—'}</strong>
                    </div>
                </div>
            </div>

            <div className="profile-content-grid">
                <article className="profile-card">
                    <div className="profile-card-heading">
                        <span className="profile-icon-box">
                            <UserRound size={19} />
                        </span>
                        <div>
                            <h3>Personal information</h3>
                            <p>Update your contact details and profile photo.</p>
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handleProfileSubmit}>
                        <div className="profile-field">
                            <label htmlFor="profile-full-name">Full name</label>
                            <input
                                id="profile-full-name"
                                type="text"
                                value={displayEmployee?.fullName ?? ''}
                                disabled
                                readOnly
                            />
                            <span className="profile-field-hint">
                                Contact HR if your name needs to be corrected.
                            </span>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="profile-email">Company email</label>
                            <input
                                id="profile-email"
                                type="email"
                                value={displayEmployee?.companyEmail ?? ''}
                                disabled
                                readOnly
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="profile-position">Position</label>
                            <input
                                id="profile-position"
                                type="text"
                                value={displayEmployee?.position ?? 'Not set'}
                                disabled
                                readOnly
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="profile-phone">Phone number</label>
                            <input
                                id="profile-phone"
                                type="tel"
                                value={phoneNumber}
                                onChange={(event) => setPhoneNumber(event.target.value)}
                                maxLength={30}
                                placeholder="+62 812 3456 7890"
                                autoComplete="tel"
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="profile-photo-file">Profile photo</label>

                            <div className="profile-upload-row">
                                <div className="profile-upload-preview">
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt="Profile photo preview"
                                            onError={(event) => {
                                                event.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    ) : (
                                        <Camera size={24} />
                                    )}
                                </div>

                                <div className="profile-upload-controls">
                                    <label
                                        className={`profile-upload-button ${isUploadingPhoto ? 'is-uploading' : ''
                                            }`}
                                        htmlFor="profile-photo-file"
                                    >
                                        {isUploadingPhoto ? (
                                            <>
                                                <LoaderCircle size={16} className="profile-spinner" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={16} />
                                                Choose image
                                            </>
                                        )}
                                    </label>

                                    <input
                                        id="profile-photo-file"
                                        className="profile-file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={isUploadingPhoto || isSavingProfile}
                                    />

                                    <span className="profile-field-hint">
                                        Select an image up to 32 MB. Your new photo is applied when you save changes.
                                    </span>
                                </div>
                            </div>

                            {photoUploadError && (
                                <div className="profile-alert profile-alert-error" role="alert">
                                    {photoUploadError}
                                </div>
                            )}

                            {photoUrl && (
                                <button
                                    className="profile-remove-photo"
                                    type="button"
                                    disabled={isUploadingPhoto || isSavingProfile}
                                    onClick={() => {
                                        setPhotoUrl('')
                                        setPhotoUploadError('')
                                        setProfileSuccess('')
                                    }}
                                >
                                    Remove photo
                                </button>
                            )}
                        </div>

                        {profileSuccess && (
                            <div className="profile-alert profile-alert-success" role="status">
                                <Check size={16} />
                                {profileSuccess}
                            </div>
                        )}

                        <div className="profile-form-actions">
                            <button
                                className="profile-primary-button"
                                type="submit"
                                disabled={isSavingProfile || isLoading || isUploadingPhoto}                            >
                                {isSavingProfile ? (
                                    <>
                                        <LoaderCircle size={16} className="profile-spinner" />
                                        Saving changes...
                                    </>
                                ) : (
                                    'Save changes'
                                )}
                            </button>
                        </div>
                    </form>
                </article>

                <article className="profile-card">
                    <div className="profile-card-heading">
                        <span className="profile-icon-box">
                            <KeyRound size={19} />
                        </span>
                        <div>
                            <h3>Account security</h3>
                            <p>Change your password to keep your account secure.</p>
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handlePasswordSubmit}>
                        <div className="profile-field">
                            <label htmlFor="current-password">Current password</label>
                            <div className="profile-password-input">
                                <input
                                    id="current-password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(event) => setCurrentPassword(event.target.value)}
                                    minLength={8}
                                    maxLength={72}
                                    required
                                    autoComplete="current-password"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    className="profile-password-toggle"
                                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                                    onClick={() => setShowCurrentPassword((value) => !value)}
                                >
                                    {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="new-password">New password</label>
                            <div className="profile-password-input">
                                <input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    minLength={8}
                                    maxLength={72}
                                    required
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                />
                                <button
                                    type="button"
                                    className="profile-password-toggle"
                                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                    onClick={() => setShowNewPassword((value) => !value)}
                                >
                                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            <span className="profile-field-hint">
                                Use between 8 and 72 characters.
                            </span>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="confirm-password">Confirm new password</label>
                            <div className="profile-password-input">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    minLength={8}
                                    maxLength={72}
                                    required
                                    autoComplete="new-password"
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    className="profile-password-toggle"
                                    aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                                    onClick={() => setShowConfirmPassword((value) => !value)}
                                >
                                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="profile-alert profile-alert-error" role="alert">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="profile-alert profile-alert-success" role="status">
                                <Check size={16} />
                                {passwordSuccess}
                            </div>
                        )}

                        <div className="profile-security-note">
                            <ShieldCheck size={17} />
                            <span>Your password is never displayed or stored by this page.</span>
                        </div>

                        <div className="profile-form-actions">
                            <button
                                className="profile-primary-button"
                                type="submit"
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? (
                                    <>
                                        <LoaderCircle size={16} className="profile-spinner" />
                                        Updating password...
                                    </>
                                ) : (
                                    'Update password'
                                )}
                            </button>
                        </div>
                    </form>
                </article>
            </div>
        </section>
    )
}
