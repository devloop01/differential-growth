import { format } from "date-fns";

const timestamp = () => {
  return format(new Date(), "yyyy-MM-dd-HH-mm-ss");
};

export class Recorder {
  constructor({ canvas, fps }) {
    this.canvas = canvas;
    this.fps = fps || 24;
    this.chunks = [];

    this.setupRecorder();
  }

  setupRecorder() {
    this.chunks.length = 0;
    this.stream = this.canvas.captureStream(this.fps);
    this.recorder = new MediaRecorder(this.stream);

    this.recorder.ondataavailable = (e) => {
      if (e.data.size) {
        this.chunks.push(e.data);
      }
    };

    this.recorder.onstop = () => this.exportVideo();
  }

  start() {
    console.log("Starting recording");
    this.recorder.start();
  }

  stop() {
    console.log("Stopping recording");
    this.recorder.stop();
  }

  exportVideo() {
    if (!this.chunks.length) {
      console.log("No data to export");
      return;
    }

    const blob = new Blob(this.chunks);
    const vid = document.createElement("video");
    vid.id = "recorded";
    vid.src = URL.createObjectURL(blob);

    // now download the video
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = vid.src;
    a.download = `${timestamp()}.webm`;
    a.click();
    document.body.removeChild(a);
  }
}
