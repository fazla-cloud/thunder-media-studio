'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database'
import { Upload, X, User } from 'lucide-react'
import Image from 'next/image'
import { ImageCropDialog } from './ImageCropDialog'

type Profile = Database['public']['Tables']['profiles']['Row']

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  title: z.string().optional().nullable(),
})

type ProfileInput = z.infer<typeof profileSchema>

interface ProfileEditorProps {
  profile: Profile
  userEmail?: string | null
}

export function ProfileEditor({ profile, userEmail }: ProfileEditorProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      title: profile.title || '',
    },
  })

  useEffect(() => {
    reset({
      full_name: profile.full_name || '',
      title: profile.title || '',
    })
    setAvatarUrl(profile.avatar_url)
  }, [profile, reset])

  // Get public URL for avatar
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB')
      return
    }

    // Read file and open crop dialog
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageSrc = reader.result as string
      setImageToCrop(imageSrc)
      setCropDialogOpen(true)
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setUploading(true)
    setError(null)

    try {
      // Validate cropped image size (max 2MB)
      if (croppedImageBlob.size > 2 * 1024 * 1024) {
        setError('Cropped image size must be less than 2MB')
        setUploading(false)
        return
      }

      // Create preview from cropped blob
      const previewUrl = URL.createObjectURL(croppedImageBlob)
      setPreviewUrl(previewUrl)

      const fileExt = 'jpg'
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      // Delete old avatar if exists
      if (profile.avatar_url) {
        await supabase.storage.from('avatars').remove([profile.avatar_url])
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      // Update profile with new avatar URL
      const updateData: Database['public']['Tables']['profiles']['Update'] = { avatar_url: filePath }
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update(updateData)
        .eq('id', profile.id)

      if (updateError) throw updateError

      setAvatarUrl(filePath)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return

    setUploading(true)
    setError(null)

    try {
      // Delete file from storage
      // avatarUrl is stored as: user_id/filename
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([avatarUrl])

      if (deleteError) throw deleteError

      // Update profile to remove avatar_url
      const updateData2: Database['public']['Tables']['profiles']['Update'] = { avatar_url: null }
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update(updateData2)
        .eq('id', profile.id)

      if (updateError) throw updateError

      setAvatarUrl(null)
      setPreviewUrl(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to remove image')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const updateData3: Database['public']['Tables']['profiles']['Update'] = {
        full_name: data.full_name,
        title: data.title || null,
      }
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update(updateData3)
        .eq('id', profile.id)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {previewUrl || (avatarUrl && getAvatarUrl(avatarUrl)) ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                    <Image
                      src={previewUrl || getAvatarUrl(avatarUrl)!}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB. 1:1 aspect ratio required.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Senior Designer, Marketing Manager"
            />
            <p className="text-xs text-muted-foreground">
              Your professional title or role designation
            </p>
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Role can only be changed by an administrator
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-muted p-3 text-sm text-foreground border border-border">
              Profile updated successfully!
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Image Crop Dialog */}
        {imageToCrop && (
          <ImageCropDialog
            open={cropDialogOpen}
            imageSrc={imageToCrop}
            onClose={() => {
              setCropDialogOpen(false)
              setImageToCrop(null)
            }}
            onCropComplete={handleCropComplete}
          />
        )}
      </CardContent>
    </Card>
  )
}
