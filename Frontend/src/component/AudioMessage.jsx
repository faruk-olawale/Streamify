const AudioMessage = ({ message }) => {
  const audio = message.attachments?.find(a => a.type === "audio");
  if (!audio) return null;

  return (
    <audio controls className="w-full mt-2">
      <source src={audio.asset_url} type={audio.mime_type} />
      Your browser does not support audio.
    </audio>
  );
};


export default AudioMessage;
