
(function main() {
var assetsDir = '_assets';
var MyGame = {};


MyGame.bootState = function(t) {},
MyGame.bootState.prototype = {
    preload: function() {},
    create: function() {
        this.game.scale.maxWidth = window.innerHeight * 1.5;
        this.game.scale.maxHeight = window.innerHeight;
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignHorizontally = true;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.state.start('preload');
    }
},

MyGame.preloadState = function(t) {},
MyGame.preloadState.prototype = {
    init: function() { },
    preload: function() {
        this.text = this.add.text(this.game.width/2, this.game.height/2, 'загрузка', {fill: '#ffffff'});
        this.text.anchor.set(0.5, 0.5);
        this.load.onFileComplete.add(this.fileComplete, this);
        this.load.image('bg', assetsDir + '/_sprites/bg.png'),
        this.load.image('table', assetsDir + '/_sprites/table.png'),
        this.load.image('progress', assetsDir + '/_sprites/progress.png'),
        this.load.image('arrow', assetsDir + '/_sprites/arrow.png'),
        this.load.image('tutorialField', assetsDir + '/_sprites/tutorial_field.png'),
        this.load.spritesheet('bad', assetsDir + '/_sprites/bad.png', 70, 70);
        /*this.load.audio('sound_smash', assetsDir + '/audio/strike.mp3'),*/
    },

    create: function() { this.state.start('title'); },

    fileComplete: function(progress) { this.text.text = 'загрузка ' + progress + '%'; }
},

MyGame.titleScreenState = function(t) {},
MyGame.titleScreenState.prototype = {
    init: function(){
        this.game.globalScore = 0;
        this.game.currentLevel = -1;
    },
    create: function() {
        this.input.onDown.add(this.onDown, this);

    },
    onDown: function(pointer) { this.state.start('main');  }
},

MyGame.mainState = function(t) {},
MyGame.mainState.prototype = {
    init: function() {
        this.INITIAL_DELAY = 10;
        this.score = 0;
        this.seccionScore = 0;
        this.onTable = false;
        this.pointDelay = this.INITIAL_DELAY;
        this.gameTimer = 0;
        this.badTimer = 0;
        this.badObjectDelay = 20;
        this.maxBadObjects = 10;
        this.failed = false;
        this.tutorialPassed = localStorage.getItem('tutorialPassed') || false;
        this.tutorialStage = 0;
        console.log(this.tutorialPassed);
    },

    create: function() {
        this.add.sprite(0, 0, 'bg');
        this.button = this.add.sprite(0, 0, 'table');
        this.button.inputEnabled = true;

        this.button.events.onInputOver.add(function() {
            this.onTable = true;
        }, this);
        this.button.events.onInputOut.add(this.moveAway, this);
        this.progressBar = this.add.sprite(300, 20, 'progress');
        this.badObjects = this.add.group();

        this.arrow = this.add.sprite(200, 200, 'arrow');
        this.arrow.rotation = 1.5;
        this.tutorialField = this.add.sprite(50, 400, 'tutorialField');
        if (this.tutorialPassed) {
            this.arrow.kill();
            this.tutorialField.kill();
        }

        this.scoreText = this.add.text(800, 20, this.score);
        this.timer = this.time.create(false);
        this.timer.loop(100, this.timerLoop, this);
        this.timer.start();
    },

    addBadObject: function() {
        if (!this.tutorialPassed && (this.tutorialStage < 1 || this.badObjects.total > 0))  return;

        var badObject = this.badObjects.create(
            this.tutorialPassed ? Math.floor(Math.random() * (830 - 200) + 200) : 430,
            this.tutorialPassed ? Math.floor(Math.random() * (530 - 100) + 100) : 160,
            'bad');
        badObject.animations.add('main', [Math.floor(Math.random() * 2)], 0, false);
        badObject.animations.play('main');
        badObject.inputEnabled = true;
        badObject.events.onInputDown.add(function(bobj) {
            bobj.kill();
            if (!this.tutorialPassed)  {
                this.tutorialPassed = true;
                this.arrow.kill();
                this.tutorialField.kill();
            }
        }, this);
    },

    moveAway: function() {
        this.seccionScore = 0;
        this.onTable = false;
        this.pointDelay = this.INITIAL_DELAY;
        this.gameTimer = 0;
    },

    checkProgress: function() {
        this.progressBar.scale.x = this.badObjects.total;
        var r = this.badObjects.total > 3 ? 0xff0000 : 0x000000;
        var g = this.badObjects.total < 7 ? 0x00ff00 : 0x000000;
        this.progressBar.tint = this.badObjects.total < this.maxBadObjects ? r + g : 0xaa0000;
    },

    timerLoop: function() {
        if (this.onTable && !this.failed) {
            this.gameTimer++;
            if (this.gameTimer >= this.pointDelay) {
                if (!this.tutorialPassed && this.score >= 5) return;
                var scoreAdd = Math.ceil(this.seccionScore / 100) != 0 ? Math.ceil(this.seccionScore / 100) : 1;
                this.seccionScore += scoreAdd;
                this.score += scoreAdd;
                this.scoreText.text = this.score;
                if (!this.tutorialPassed && this.score >= 5 && this.tutorialStage < 1) {
                    this.tutorialStage = 1;
                    this.addBadObject();
                    this.arrow.rotation = 2;
                    this.arrow.x = 500;
                    this.arrow.y = 250;
                    this.tutorialField.x = 300

                }
                if (this.score != 0 && this.score % 10 == 0 && this.pointDelay > 1) this.pointDelay--;
                this.gameTimer = 0;
            }
        }
        if (this.failed) {
            this.gameTimer++;
            if (this.gameTimer > 20) this.state.start('finish');
        }
        else {
           this.badTimer++;
           if (this.badTimer >= this.badObjectDelay) {
               this.badTimer = 0;
               this.addBadObject();
               if (this.badObjects.total >= this.maxBadObjects) {
               this.gameTimer = 0;
               this.failed = true;
               this.game.globalScore = this.score;
               }
           }
        }
    },
    update: function() {

        this.checkProgress();
    }

},

MyGame.finishState = function(t) {},
MyGame.finishState.prototype = {
    init: function() {
    },

    create: function() {
        console.log(this.game.globalScore);
    },

    onDown: function(pointer) {
    }
};

window.onload = function() {
    var t = new Phaser.Game(900, 600, Phaser.AUTO, 'game_container');
    t.global = {},
        t.state.add('boot', MyGame.bootState),
        t.state.add('preload', MyGame.preloadState),
        t.state.add('title', MyGame.titleScreenState),
        t.state.add('main', MyGame.mainState),
        t.state.add('finish', MyGame.finishState),
        t.state.start('boot');
};

})();

