import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2 } from 'lucide-react';
import Button from './UI/Button';
import Card from './UI/Card';
import toast from 'react-hot-toast';
import { copyToClipboard } from '@utils/helpers';

const QRCodeGenerator = ({ value, title, description, size = 256 }) => {
  const qrRef = useRef(null);

  const handleDownload = () => {
    try {
      const svg = qrRef.current;
      if (!svg) return;

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = size;
      canvas.height = size;

      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'max-it-tv-qr-code.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('QR code downloaded successfully!');
        });
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || 'Max IT TV',
          text: description || 'Join Max IT TV',
          url: value,
        });
      } else {
        // Fallback to copying link
        const success = await copyToClipboard(value);
        if (success) {
          toast.success('Link copied to clipboard!');
        } else {
          toast.error('Failed to copy link');
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Failed to share');
      }
    }
  };

  return (
    <Card className="text-center">
      <div className="flex flex-col items-center gap-6">
        {(title || description) && (
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}

        {/* QR Code */}
        <div className="p-6 bg-white border-2 border-gray-200 rounded-xl inline-block">
          <QRCodeSVG
            ref={qrRef}
            value={value}
            size={size}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* URL Display */}
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="text"
              value={value}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            />
            <button
              onClick={() => {
                copyToClipboard(value);
                toast.success('Link copied!');
              }}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="primary"
            icon={<Download size={18} />}
            onClick={handleDownload}
          >
            Download QR Code
          </Button>

          <Button
            variant="outline"
            icon={<Share2 size={18} />}
            onClick={handleShare}
          >
            Share Link
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QRCodeGenerator;
