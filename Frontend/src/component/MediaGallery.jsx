import { useState, useEffect } from "react";
import { Image as ImageIcon, Video, X, ChevronLeft, ChevronRight } from "lucide-react";

const MediaGallery = ({ channel }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!channel) return;

    const fetchMedia = async () => {
      setLoading(true);
      try {
        const response = await channel.query({
          messages: { limit: 100 },
        });

        const mediaItems = [];
        response.messages.forEach((message) => {
          if (message.attachments && message.attachments.length > 0) {
            message.attachments.forEach((attachment) => {
              if (attachment.type === "image" || attachment.type === "video") {
                mediaItems.push({
                  id: `${message.id}-${attachment.asset_url || attachment.image_url}`,
                  type: attachment.type,
                  url: attachment.asset_url || attachment.image_url || attachment.thumb_url,
                  timestamp: message.created_at,
                  user: message.user,
                });
              }
            });
          }
        });

        mediaItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMedia(mediaItems);
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [channel]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ImageIcon size={32} className="text-primary/50" />
        </div>
        <p className="text-sm text-base-content/50 font-medium">No media shared yet</p>
        <p className="text-xs text-base-content/40 mt-1">Share photos and videos in the chat</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {media.map((item, index) => (
          <div
            key={item.id}
            className="relative aspect-square bg-base-200 rounded-xl overflow-hidden cursor-pointer group hover:scale-105 transition-transform shadow-md"
            onClick={() => {
              setSelectedMedia(item);
              setCurrentIndex(index);
            }}
          >
            {item.type === "image" ? (
              <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="relative w-full h-full">
                <video src={item.url} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Video size={32} className="text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <p className="text-white text-xs">{new Date(item.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 btn btn-circle btn-sm bg-base-100/20 text-white border-none">
            <X size={20} />
          </button>
          {media.length > 1 && (
            <>
              <button onClick={() => {
                const newIndex = (currentIndex - 1 + media.length) % media.length;
                setCurrentIndex(newIndex);
                setSelectedMedia(media[newIndex]);
              }} className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle bg-base-100/20 text-white border-none">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => {
                const newIndex = (currentIndex + 1) % media.length;
                setCurrentIndex(newIndex);
                setSelectedMedia(media[newIndex]);
              }} className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle bg-base-100/20 text-white border-none">
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <div className="max-w-5xl max-h-[80vh]">
            {selectedMedia.type === "image" ? (
              <img src={selectedMedia.url} alt="" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            ) : (
              <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg" />
            )}
            <div className="mt-4 text-center text-white">
              <p className="text-sm">{selectedMedia.user?.name}</p>
              <p className="text-xs opacity-75">{new Date(selectedMedia.timestamp).toLocaleString()}</p>
              {media.length > 1 && <p className="text-xs mt-2">{currentIndex + 1} of {media.length}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaGallery;