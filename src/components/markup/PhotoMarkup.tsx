"use client";

/**
 * PhotoMarkup
 * Markup overlay for a single photo/image.
 * Shows the image fullscreen with drawing tools.
 * onSave returns the annotated composite image.
 */

import MarkupCanvas, { type MarkupAction } from "./MarkupCanvas";

interface PhotoMarkupProps {
  /** URL or data URL of the image to annotate */
  imageUrl: string;
  /** Called with the annotated image data URL */
  onSave: (annotatedDataUrl: string) => void;
  /** Called when the user cancels */
  onClose: () => void;
}

export default function PhotoMarkup({ imageUrl, onSave, onClose }: PhotoMarkupProps) {
  const handleDone = (compositeDataUrl: string, _actions: MarkupAction[]) => {
    onSave(compositeDataUrl);
  };

  return (
    <MarkupCanvas
      backgroundImageUrl={imageUrl}
      onDone={handleDone}
      onCancel={onClose}
    />
  );
}
