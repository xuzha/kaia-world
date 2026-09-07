import {
  drawingSize,
  maxDrawingPoints,
  type Drawing,
  type DrawingPoint,
  type Stroke,
} from '../play/drawing-data';
import { drawingColors } from './wonders';

function renderStrokes(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, drawingSize, drawingSize);
  ctx.lineCap = ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    ctx.strokeStyle = ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(...stroke.points[0]);
    for (const p of stroke.points.slice(1)) ctx.lineTo(...p);
    if (stroke.fill) {
      ctx.closePath();
      ctx.fill();
    }
    if (stroke.points.length === 1) {
      ctx.arc(...stroke.points[0], stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.stroke();
  }
}

function starter(kind: string): Stroke[] {
  let outline: DrawingPoint[];
  if (kind === 'star') {
    outline = Array.from({ length: 10 }, (_, i) => {
      const angle = (i * Math.PI) / 5 - Math.PI / 2,
        radius = i % 2 ? 65 : 140;
      return [192 + Math.cos(angle) * radius, 190 + Math.sin(angle) * radius];
    });
    outline.push(outline[0]);
  } else {
    outline = [[121, 172]];
    const curve = (a: DrawingPoint, b: DrawingPoint, c: DrawingPoint) => {
      const from = outline[outline.length - 1];
      for (let i = 1; i <= 18; i++) {
        const t = i / 18,
          u = 1 - t;
        outline.push([
          u ** 3 * from[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t ** 3 * c[0],
          u ** 3 * from[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t ** 3 * c[1],
        ]);
      }
    };
    curve([59, 34], [149, 6], [171, 159]);
    curve([183, 154], [201, 154], [213, 159]);
    curve([235, 6], [325, 34], [263, 172]);
    curve([350, 227], [301, 328], [192, 325]);
    curve([83, 328], [34, 227], [121, 172]);
  }
  const eyeY = kind === 'star' ? 186 : 226;
  return [
    { color: kind === 'star' ? '#e0b65f' : '#efd8bc', width: 6, points: outline, fill: true },
    { color: '#6b6455', width: 5, points: outline },
    ...[163, 221].map((x): Stroke => ({ color: '#6b6455', width: 11, points: [[x, eyeY]] })),
    { color: '#c98770', width: 13, points: [[144, eyeY + 21]] },
    { color: '#c98770', width: 13, points: [[240, eyeY + 21]] },
    {
      color: '#6b6455',
      width: 4,
      points: [
        [181, eyeY + 23],
        [192, eyeY + 30],
        [203, eyeY + 23],
      ],
    },
  ];
}

export class DrawingPad {
  private strokes: Stroke[] = [];
  private history: Stroke[][] = [];
  private pointerId?: number;
  private color = drawingColors[0];
  private points = 0;
  readonly canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
  private name = document.getElementById('plush-name') as HTMLInputElement;
  private size = document.getElementById('brush-size') as HTMLInputElement;

  constructor() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || this.pointerId !== undefined) return;
      event.preventDefault();
      if (this.points >= maxDrawingPoints || this.strokes.length >= 150) {
        document.getElementById('drawing-message')!.textContent =
          '这张画已经很丰富啦，先让它变成布偶吧。';
        return;
      }
      this.remember();
      this.pointerId = event.pointerId;
      this.canvas.setPointerCapture(event.pointerId);
      this.strokes.push({
        color: this.color,
        width: Number(this.size.value),
        points: [this.point(event)],
      });
      this.points++;
      this.render();
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.pointerId || this.points >= maxDrawingPoints) return;
      const stroke = this.strokes[this.strokes.length - 1],
        p = this.point(event),
        last = stroke.points.at(-1)!;
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
      stroke.points.push(p);
      this.points++;
      this.render();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
      this.canvas.addEventListener(type, (event) => {
        if ((event as PointerEvent).pointerId === this.pointerId) this.pointerId = undefined;
      });
    document.querySelectorAll<HTMLButtonElement>('[data-crayon]').forEach((button) => {
      button.addEventListener('click', () => {
        this.color = button.dataset.crayon!;
        document
          .querySelectorAll<HTMLButtonElement>('[data-crayon]')
          .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      });
    });
    document.getElementById('undo-drawing')!.addEventListener('click', () => {
      this.endStroke();
      this.strokes = this.history.pop() ?? this.strokes;
      this.render();
    });
    document.getElementById('clear-drawing')!.addEventListener('click', () => {
      this.remember();
      this.strokes = [];
      this.render();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-drawing-starter]').forEach((button) => {
      button.addEventListener('click', () => {
        this.remember();
        this.strokes = starter(button.dataset.drawingStarter!);
        if (this.name.value === '小小布偶')
          this.name.value = button.dataset.drawingStarter === 'bunny' ? '小棉兔' : '小星星';
        this.render();
      });
    });
  }

  private point(event: PointerEvent): DrawingPoint {
    const rect = this.canvas.getBoundingClientRect();
    return [
      Math.max(0, Math.min(drawingSize, ((event.clientX - rect.left) / rect.width) * drawingSize)),
      Math.max(0, Math.min(drawingSize, ((event.clientY - rect.top) / rect.height) * drawingSize)),
    ];
  }
  private remember() {
    this.endStroke();
    this.history.push(this.strokes.slice());
    if (this.history.length > 30) this.history.shift();
  }
  private endStroke() {
    if (this.pointerId === undefined) return;
    if (this.canvas.hasPointerCapture(this.pointerId))
      this.canvas.releasePointerCapture(this.pointerId);
    this.pointerId = undefined;
  }
  private render() {
    this.points = this.strokes.reduce((n, s) => n + s.points.length, 0);
    renderStrokes(this.canvas, this.strokes);
    (document.getElementById('create-plush') as HTMLButtonElement).disabled = !this.strokes.length;
    (document.getElementById('clear-drawing') as HTMLButtonElement).disabled = !this.strokes.length;
    (document.getElementById('undo-drawing') as HTMLButtonElement).disabled = !this.history.length;
    document.getElementById('drawing-hint')!.hidden = !!this.strokes.length;
  }
  load(drawing: Drawing) {
    this.strokes = drawing.strokes;
    this.name.value = drawing.name;
    this.history = [];
    this.render();
  }
  drawing(): Drawing {
    return { version: 1, name: this.name.value.trim() || '小小布偶', strokes: this.strokes };
  }
}
