export function isImageByName(name: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)
}

export function canPreviewByName(name: string): boolean {
    return isImageByName(name) || /\.pdf$/i.test(name)
}

export function previewFile(file: File): void {
    const url = URL.createObjectURL(file)
    window.open(url, "_blank", "noopener,noreferrer")
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
