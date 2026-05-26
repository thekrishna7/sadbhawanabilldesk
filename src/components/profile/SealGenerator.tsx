'use client'

import { useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SealGeneratorProps {
  companyName: string
  detail: string
  onCompanyNameChange: (value: string) => void
  onDetailChange: (value: string) => void
  onSealGenerated: (dataUrl: string) => void
}

export default function SealGenerator({
  companyName,
  detail,
  onCompanyNameChange,
  onDetailChange,
  onSealGenerated,
}: SealGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasContent = !!(companyName || detail)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!companyName && !detail) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 300
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    const centerX = size / 2
    const centerY = size / 2
    const outerRadius = size / 2 - 10
    const innerRadius = outerRadius - 20

    // Draw outer circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
    ctx.strokeStyle = '#047857'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw inner circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.strokeStyle = '#047857'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw decorative dots around the outer edge
    const dotCount = 60
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2
      const dotRadius = i % 2 === 0 ? 2.5 : 1.5
      const dotX = centerX + (outerRadius - 10) * Math.cos(angle)
      const dotY = centerY + (outerRadius - 10) * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#047857'
      ctx.fill()
    }

    // Draw star in the center
    const starPoints = 5
    const starOuterRadius = 25
    const starInnerRadius = 12
    ctx.beginPath()
    for (let i = 0; i < starPoints * 2; i++) {
      const radius = i % 2 === 0 ? starOuterRadius : starInnerRadius
      const angle = (i * Math.PI) / starPoints - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fillStyle = '#047857'
    ctx.fill()

    // Draw company name along the top arc
    if (companyName) {
      const textRadius = outerRadius - 28
      const fontSize = Math.max(12, Math.min(18, 300 / companyName.length))
      ctx.font = `bold ${fontSize}px serif`
      ctx.fillStyle = '#047857'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const text = companyName.toUpperCase()
      const charAngle = (Math.PI * 0.8) / text.length
      const startAngle = -Math.PI / 2 - (charAngle * text.length) / 2

      for (let i = 0; i < text.length; i++) {
        const angle = startAngle + charAngle * (i + 0.5)
        const x = centerX + textRadius * Math.cos(angle)
        const y = centerY + textRadius * Math.sin(angle)

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle + Math.PI / 2)
        ctx.fillText(text[i], 0, 0)
        ctx.restore()
      }
    }

    // Draw detail along the bottom arc
    if (detail) {
      const textRadius = outerRadius - 28
      const fontSize = Math.max(10, Math.min(14, 250 / detail.length))
      ctx.font = `${fontSize}px serif`
      ctx.fillStyle = '#047857'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const text = detail.toUpperCase()
      const charAngle = (Math.PI * 0.8) / text.length
      const startAngle = Math.PI / 2 - (charAngle * text.length) / 2

      for (let i = 0; i < text.length; i++) {
        const angle = startAngle + charAngle * (i + 0.5)
        const x = centerX + textRadius * Math.cos(angle)
        const y = centerY + textRadius * Math.sin(angle)

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle - Math.PI / 2)
        ctx.fillText(text[i], 0, 0)
        ctx.restore()
      }
    }

    const dataUrl = canvas.toDataURL('image/png')
    onSealGenerated(dataUrl)
  }, [companyName, detail, onSealGenerated])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `${companyName || 'seal'}-seal.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sealCompanyName">Company Name</Label>
          <Input
            id="sealCompanyName"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Enter company name for seal"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sealDetail">Additional Detail</Label>
          <Input
            id="sealDetail"
            value={detail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder="e.g., AUTHORIZED SIGNATORY"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative bg-muted/30 rounded-xl p-4 border border-dashed border-border">
          <canvas
            ref={canvasRef}
            className="mx-auto"
            style={{ maxWidth: '250px', maxHeight: '250px' }}
          />
          {(!companyName && !detail) && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Enter details to preview seal
            </div>
          )}
        </div>

        {hasContent && (companyName || detail) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Seal
          </Button>
        )}
      </div>
    </div>
  )
}
