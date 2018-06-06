let canvas = null;
let ctx = null;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function setup(canvas: HTMLCanvasElement) {

    canvas = canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext("2d");
    for (let i = 0; i < ballCount; i++) {

        let x = getRandomInt(0, window.innerWidth);
        let y = getRandomInt(0, window.innerHeight);
        let ball = new Ball(i, x, y);
        if (i !== 0) {
            ball.sibling = balls[i - 1];
        }
        balls.push(ball);
    }
    setInterval(draw, 1000 / 60);
}

function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    balls[balls.length - 1].step(ctx);
    if (!nextActiveBall) {
        nextActiveBall = nextActiveBallSteps;
        activeBall++;
        if (activeBall === balls.length) {
            activeBall = 0;
        }
    }
    nextActiveBall--;
}

const ballCount = 40;
const balls: Array<Ball> = [];
let ballColor = '#e8425c';
let strokeColor = '#4c4355';
const activeStrokeColor = '#00b0e7';
const ballMinSize = 2;
const ballMaxSize = 5;
const growSpeed = 0.25;
const moveSpeed = 1;

export function changeBallColor(color: string) {
    ballColor = color;
    strokeColor = color;
}

let activeBall = 0;
const nextActiveBallSteps = 7;
let nextActiveBall = nextActiveBallSteps;

class Ball {
    id;
    x: number;
    y: number;
    sibling: Ball = null;
    size = Math.floor(getRandomInt(ballMinSize, ballMaxSize));
    resetDirection: number = 0;
    moveSteps = Math.floor(getRandomInt(20, 50));
    direction: number = 1;
    grow = true;

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }

    adjustSize() {
        if (this.grow) {
            if (this.size < ballMaxSize) {
                this.size += growSpeed;
                return;
            }
            this.grow = false;
            return;
        }
        if (this.size > 0) {
            this.size -= growSpeed;
            return;
        }
        this.grow = true;
    }

    move() {
        if (this.resetDirection == 0) {
            this.resetDirection = this.moveSteps;
            this.direction = Math.floor(getRandomInt(1, 8));
        }
        switch (this.direction) {
            case 1:
                this.moveRight();
                break;
            case 2:
                this.moveLeft();
                break;
            case 3:
                this.moveDown();
                break;
            case 4:
                this.moveUp();
                break;
            case 5:
                this.moveRight().moveUp();
                break;
            case 6:
                this.moveRight().moveDown();
                break;
            case 7:
                this.moveLeft().moveUp();
                break;
            case 8:
                this.moveLeft().moveDown()
                break;
        }
        this.resetDirection--;
    }

    moveLeft() {
        this.x - moveSpeed < 0 ? 0 : this.x -= moveSpeed;
        return this;
    }

    moveRight() {
        this.x + moveSpeed > window.innerWidth ? null : this.x += moveSpeed;
        return this;
    }

    moveUp() {
        this.y - moveSpeed < 0 ? null : this.y -= moveSpeed;
        return this;
    }

    moveDown() {
        this.y + moveSpeed > window.innerHeight ? null : this.y += moveSpeed;
        return this;
    }

    step(ctx: CanvasRenderingContext2D) {
        this.adjustSize();
        this.move();
        this.drawConnToSibling(ctx);
        this.draw(ctx);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        if (this.id) {
            ctx.strokeStyle = ballColor;
            ctx.fillStyle = ballColor;
        } else {
            ctx.strokeStyle = '#1bddca';
            ctx.fillStyle = '#1bddca';
        }
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawConnToSibling(ctx: CanvasRenderingContext2D) {
        let sibling = this.sibling;
        if (!sibling) return;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        if (activeBall == this.id) {
            ctx.strokeStyle = activeStrokeColor;
        } else {
            ctx.strokeStyle = strokeColor;
        }
        ctx.lineTo(sibling.x, sibling.y);
        ctx.stroke();
        sibling.step(ctx);
    }
}
