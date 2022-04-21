/*****************************************************
 * simple 2d arcade game                             *
 * created by Peter Mekis for CodingKidsMalta        *
 * 2022                                              *
 * thx for the sound effects: OwlStorm, MusicLegends *
 *****************************************************/

// generates random integer in inclusive range, randint-style
// rng(10, 11) // 10 to 11
// rng(0, 100) // 0 to 100
const rng = function(minValue, maxValue) {
  return Math.floor(Math.random() * (maxValue-minValue+1)) + minValue;
};

// a general sprite class; specific sprites will be its child classes
class Sprite {
  constructor(game, costumeName, x, y, sx, sy) {
    this.game = game;
    this.costume = new Image;
    this.costume.src = `${costumeName}.png`;
    this.x = x;
    this.y = y;
    this.sx = sx;
    this.sy = sy;
    this.alive = true;
  };

  // updates the sprite data for each frame
  update() {
    this.x += this.sx;
    this.y += this.sy;
  }

  // displays the sprite in the game's canvas
  display() {
    const displayX = this.x - this.costume.width / 2;
    const displayY = this.y - this.costume.height / 2;
    this.game.ctx.drawImage(this.costume, displayX, displayY);
  };

  // coordinates of costume borders for collision detection
  getCoords() {
    let x = this.x;
    let w = this.costume.width/2;
    let y = this.y;
    let h = this.costume.height/2;
    return [x - w, x + w, y - h, y + h]
  };

  // collision detection
  collidesWith(other) {
    // get border coordinates for both 'this' and 'other'
    let tx0, tx1, ty0, ty1, ox0, ox1, oy0, oy1;
    [tx0, tx1, ty0, ty1] = this.getCoords();
    [ox0, ox1, oy0, oy1] = other.getCoords();
    // sprites collide if they overlap (1) horizontally and (2) vertically
    // (1a) left border of of 'this'  between left and right borders of 'other'
    let collideX0 = ox0 <= tx0 && tx0 <= ox1;
    // (1b) left border of 'other' between left and right borders of 'this'
    let collideX1 = tx0 <= ox0 && ox0 <= tx1;
    // (2a) top border of 'this' between top and bottom borders of 'other'
    let collideY0 = oy0 <= ty0 && ty0 <= oy1;
    // (2b) top border of 'other' between top and bottom borders of 'this'
    let collideY1 = ty0 <= oy0 && oy0 <= ty1;
    let collide = (collideX0 || collideX1) && (collideY0 || collideY1);
    return collide;
  };

}; // Sprite

// sprite controlled by the user; it will have a single instance
class Hero extends Sprite {
  // constant properties are set here, cariable ones in reset()
  constructor(game) {
    super(game, "hero", game.width/2, game.height*7/8, 0, 0);
    this.baseSpeed = 4;
    this.minPos = this.costume.width / 2;
    this.maxPos = this.game.width - this.costume.width / 2;
    this.hiscore = 0;
    this.soundEffect = new Audio("hero_shoot.wav");
    this.soundEffect.volume = 0.1;
    this.cooldownTime = 10; // frames between firing shots
    this.setupControl();
    this.reset(this);
  };

  // adds listeners for keyboard events
  setupControl() {
    let myself = this; // freakin' this...
    document.addEventListener(
      "keydown",
      (e) => {myself.handleKeydown(e, myself);}
    );
    document.addEventListener(
      "keyup",
      (e) => {myself.handleKeyup(e, myself);}
    );
  }

  // sets variable properties of the sprite to their initial values
  reset(myself) {
    this.health = 100;
    this.score = 0;
    this.x = this.game.width / 2;
    this.y = this.game.height*7/8;
    this.cooldownCounter = 0;
  }

  // method of the parent class extended with new conditions
  update() {
    super.update();
    // sprite stopped at edges
    if (this.x < this.minPos) {this.x = this.minPos;}
    else if (this.maxPos < this.x) {this.x = this.maxPos;};
    // high score updated
    if (this.hiscore < this.score) {this.hiscore = this.score;};
    // cooldown proceeds
    if (0 < this.cooldownCounter) {this.cooldownCounter--;};
  };

  // triggered by keydown event
  // 'myself' parameter needed because the context of 'this' is corrupted
  handleKeydown(event, myself) {
    // move left
    if (["a", "ArrowLeft"].includes(event.key)) {
      myself.sx = -myself.baseSpeed;
    }
    // move right
    else if (["d", "ArrowRight"].includes(event.key)) {
      myself.sx = myself.baseSpeed;
    }
    // fire a shot if cooldown ended
    else if (["w", "ArrowUp", " "].includes(event.key)) {
      if (this.cooldownCounter == 0) {
        myself.game.heroBullets.push(new HeroBullet(myself));
        this.soundEffect.play();
        this.cooldownCounter = this.cooldownTime;
      }
    };
  };

  // triggered by keyup event
  // 'myself' parameter needed because the context of 'this' is corrupted
  handleKeyup(event, myself) {
    // stop if moving left
    if (
      ["a", "ArrowLeft"].includes(event.key)
      && myself.sx == -myself.baseSpeed
    ) {
      myself.sx = 0;
    }
    // stop if moving right
    else if (
      ["d", "ArrowRight"].includes(event.key)
      && myself.sx == myself.baseSpeed
    ) {
      myself.sx = 0;
    };
  };

  // displays data at the top
  dataDisplay() {
    // displays health as a line
    let ctx = this.game.ctx
    if (50 < this.health) {ctx.strokeStyle = "darkGreen"}
    else if (10 < this.health) {ctx.strokeStyle = "yellow"}
    else {ctx.strokeStyle = "darkRed"};
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(20 + this.health * 4.38, 20);
    ctx.stroke();
    // displays score and high score as a text
    ctx.textAlign = "start";
    ctx.fillText(`score: ${this.score}`, 20, 50);
    ctx.textAlign = "end";
    ctx.fillText(`hiscore: ${this.hiscore}`, this.game.width-20, 50);
  }

}; // Hero

// sprite generated dynamicallly during gameplay
// by the createEnemy() nethod of Game
class Enemy extends Sprite {
  constructor(game, x) {
    super(game, "enemy", x, 0, 0, 5);
    this.soundEffect = new Audio("enemy_shoot.wav");
    this.soundEffect.volume = 0.1;
  };

  // method of the parent class extended with new conditions
  update() {
    super.update();
    // sprite dies at edge
    if (this.game.height < this.y) {this.alive = false};
    // sprite creates new bullet
    if (rng(0,60) == 0) {
      let newBullet = new EnemyBullet(this);
      this.game.enemyBullets.push(newBullet);
      this.soundEffect.play();
    };
  };

}; // Enemy


// sprite generated dynamically during gameplay
// by the handleKeydown) event of Hero
class HeroBullet extends Sprite {
  constructor(hero) {
    let y = hero.y - hero.costume.height / 3;
    super(hero.game, "bullet_hero", hero.x, y, 0, -10);
  };

  // method of the parent class extended with a new condition
  update() {
    super.update();
    // die at edge
    if (this.y < 0) {this.alive = false};
  };

}; // HeroBullet

// sprite generated dynamically during gameplay
// by the handleKeydown) event of Enemy
class EnemyBullet extends Sprite {
  constructor(enemy) {
    let y = enemy.y + enemy.costume.height / 2;
    super(enemy.game, "bullet_enemy", enemy.x, y, 0, 10);
  };

  // method of the parent class extended with a new condition
  update() {
    super.update();
    // die at edge
    if (this.game.height < this.y) {this.alive = false};
  };

}; // EnemyBullet

// a special sprite that serves as background
class Background extends Sprite {
  constructor(game) {
    super(game, "bg", game.width / 2, game.height / 2, 0, 0.5);
  };

  // the method of the parent class is overwritten;
  // the sprite is displayed twice to generate moving background effect
  display() {
    const gh = this.game.height;
    // two copies are displayed one atop of the other
    const displayY1 = (this.y - gh / 2) % (gh * 2) - gh;
    const displayY2 = (this.y + gh / 2) % (gh * 2) - gh;
    this.game.ctx.drawImage(this.costume, 0, displayY1);
    this.game.ctx.drawImage(this.costume, 0, displayY2);
  };

}; // Background


// This is the main object that creates game elements and controls gameplay
class Game {
  constructor() {
    // constant properties are set here
    this.width = 480;
    this.height = 720;
    this.hero = new Hero(this);
    this.bg = new Background(this);
    this.gameOn = false
    this.setCanvas();
    this.titleTimer = setInterval(this.titleDisplay.bind(this), 33);
    document.addEventListener(
      "keydown",
      (e) => {this.reset(e, this);}
    );
  };

  // triggered by keydown event
  // variable properties are set here
  reset(e, myself) {
    // no reset during gameplay
    if (!myself.gameOn) {
      myself.hero.reset();
      myself.enemies = [];
      myself.heroBullets = [];
      myself.enemyBullets = [];
      myself.ctx.font = "24px Orbitron";
      clearInterval(myself.titleTimer);
      myself.titleTimer = null;
      myself.timer = setInterval(myself.mainLoop.bind(myself), 33);
      myself.gameOn = true;
      console.log("game started");
    }
  }

  // sprites are kept in separate arrays to make collision detection easier
  get sprites() {
    return [this.bg, this.hero]
      .concat(this.enemies)
      .concat(this.heroBullets)
      .concat(this.enemyBullets);
  };

  // the canvas element is used as game stage
  // context is created and basic properties are set
  setCanvas() {
    // canvas
    let canvas = document.getElementById("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    // context
    let ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 8;
    ctx.fillStyle = "darkBlue";
    this.ctx = ctx;
  };

  // title screen before gameplay
  titleDisplay() {
    this.bg.display();
    this.hero.display();
    this.ctx.textAlign = "center";
    this.ctx.font = "48px Orbitron";
    this.ctx.fillText("Space Game", this.width / 2, this.height / 2);
  };

  // multiple cases of collision detection are iterated
  detectCollisions() {
    for (let e of this.enemies) {
      // hero collides with enemy
      if (this.hero.collidesWith(e)) {
        e.alive = false;
        this.hero.health -= 10;
        this.hero.score += 10;
        console.log("bang")
      };
      for(let b of this.heroBullets) {
        // enemy collides with hero bullet
        if (e.collidesWith(b)) {
          e.alive = false;
          b.alive = false;
          this.hero.score += 10;
          console.log("boom");
        };
      };
    };
    for (let eb of this.enemyBullets) {
      for (let hb of this.heroBullets) {
        // enemy bullet collides with hero bullet
        if (eb.collidesWith(hb)) {
          hb.alive = false;
          eb.alive = false;
          this.hero.score += 1;
        };
      };
      // hero collides with enemy bullet
      if (this.hero.collidesWith(eb)) {
        eb.alive = false;
        this.hero.health -= 5;
        this.hero.score += 1;
      };
    };
  };

  // creates an enemy object every two seconds in average
  createEnemy(myself) {
    if (rng(0,60) == 0) {
      const newEnemy = new Enemy(myself, rng(0,myself.width));
      this.enemies.push(newEnemy);
    }
  };

  // sprites are updated for the next frame
  updateSprites() {
    for (let s of this.sprites) {
      s.update();
    };
  };

  // sprites, health, and score displayed
  refreshScreen() {
    for (let s of this.sprites) {
      s.display();
    };
    this.hero.dataDisplay();
  };

  // gets rid of dead enemies and bullets
  cleanSpriteLists() {
    const clean = function(arr) {
      let newArr = [];
      for (let s of arr) {
        if (s.alive) (newArr.push(s));
      };
      return newArr;
    };
    this.enemies = clean(this.enemies);
    this.heroBullets = clean(this.heroBullets);
    this.enemyBullets = clean(this.enemyBullets);
    console.log(`sprite count: ${this.sprites.length}`) // for testing
  };

  // stops mainloop when hero dies, clearing game.timer()
  isGameOverYet() {
    if (this.hero.health <= 0) {
      clearInterval(this.timer);
      this.timer = null;
      this.ctx.textAlign = "center";
      this.ctx.font = "48px Orbitron";
      this.ctx.fillText("Game Over", this.width / 2, this.height / 2);
      this.gameOn = false;
      // setTimeout(this.reset.bind(this), 2000);
    };
  };

  // this function controls the gameplay
  // it is called at every frame
  // game.timer holds the calling interval
  // game.timer is set by reset() and cleared by isGameOverYet()
  mainLoop() {
    // console.log(this.sprites);
    this.updateSprites();
    this.detectCollisions();
    this.createEnemy(this);
    this.refreshScreen();
    this.cleanSpriteLists();
    this.isGameOverYet();
  };

}; // Game

// create a game object that creates game elements and controls gameplay
const game = new Game;
