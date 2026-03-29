import { EmptyState } from '../components/ui/EmptyState';
import { galleryMessages } from '../messages/gallery.messages';

export function GalleryPage() {
  return (
    <main className="pt-20 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-text-base text-4xl font-bold mb-10">{galleryMessages.pageTitle}</h1>
        <EmptyState
          title={galleryMessages.emptyTitle}
          description={galleryMessages.emptyDescription}
        />
      </div>
    </main>
  );
}
