function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function Ship(size, styleClass) {
    this.size = 0;
    this.vertical = false;
    this.element = document.createElement('div');
    this.element.classList.add('ship');
    this.cells = [];
    this.invalid = false;
    if (styleClass) {
        this.element.classList.add(styleClass);
    }

    this._addCell = function() {
        const cell = document.createElement('div');
        cell.classList.add('ship-cell');
        this.element.appendChild(cell);
        this.cells.push(cell);
    };
    this.disableMouseEvents = function() {
        this.element.style.pointerEvents = 'none';
    };
    this.disableContextMenu = function() {
        this.element.oncontextmenu = function() {return false};
    };
    this.setSize = function(size) {
        for(let i = size; i < this.size; ++i) {
            this.element.removeChild(this.cells.pop());
        }
        for (let i = this.size; i < size; ++i) {
            this._addCell();
        }
        this.size = size;
        this._updateStyle();
    };
    this.getSizeX = function() {
        return this.vertical ? 1 : this.size;
    };
    this.getSizeY = function() {
        return this.vertical ? this.size : 1;
    };
    this.setInvalid = function(invalid) {
        this.invalid = invalid;
        if (invalid)
            this.element.classList.add('invalid');
        else
            this.element.classList.remove('invalid');
    };
    this.setPlaced = function(placed) {
        if (placed)
            this.element.classList.add('placed');
        else
            this.element.classList.remove('placed');
    };
    this.setSelected = function(selected) {
        if (selected)
            this.element.classList.add('selected');
        else
            this.element.classList.remove('selected');
    };
    this.setVisible = function(visible) {
        this.element.style.visibility = visible ? 'visible' : 'hidden';
    };
    this.hide = function() {
        this.setVisible(false);
    };
    this.show = function() {
        this.setVisible(true);
    };
    // Following methods are for field ships only
    this.setCellSize = function(cellSize) {
        this.cellSize = cellSize;
        this._updateStyle();
    };
    this.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
        this._updateStyle();
    };
    this.setVertical = function(vertical) {
        this.vertical = vertical;
        if (vertical)
            this.element.classList.add('vertical');
        else
            this.element.classList.remove('vertical');
        this._updateStyle();
    };
    this._updateStyle = function() {
        this.element.style.left = (this.cellSize * this.x) + 'px';
        this.element.style.top = (this.cellSize * this.y) + 'px';
        this.element.style.width = (this.getSizeX() * this.cellSize - 1) + 'px';
        this.element.style.height = (this.getSizeY() * this.cellSize - 1) + 'px';
    };

    this.setSize(size);
    this.disableContextMenu();
}

function Field(size, styleClass) {
    this.size = 0;
    this.element = document.createElement('div');
    this.element.classList.add('field');
    if (styleClass)
        this.element.classList.add(styleClass);
    this.gridElement = document.createElement('div');
    this.gridElement.classList.add('field-grid');
    this.gridElement.oncontextmenu = function() {return false};
    this.element.appendChild(this.gridElement);
    this.ships = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.onMouseMove = null;
    this.onMouseDown = null;

    this.handleEvent = function(e) {
        if (e.type === 'mousemove') return this._onmousemove(e);
        if (e.type === 'mousedown') return this._onmousedown(e);
    };
    this.gridElement.addEventListener('mousemove', this);
    this.gridElement.addEventListener('mousedown', this);

    this.reset = function(size) {
        this.size = size;
        this.gridElement.textContent = '';
        const cellCount = size * size;
        for(let i = 0; i < cellCount; ++i) {
            const cell = document.createElement('div');
            cell.classList.add('field-cell');
            this.gridElement.appendChild(cell);
        }
        for (let i = 0; i < this.ships.length; ++i) {
            this.element.removeChild(this.ships[i].element);
        }
        this.ships = [];
    };
    this.addShip = function(ship) {
        const cellSize = this.gridElement.offsetWidth / this.size;
        ship.setCellSize(cellSize);
        this.element.appendChild(ship.element);
        this.ships.push(ship);
    };
    this.removeShip = function(ship) {
        const index = this.ships.indexOf(ship);
        this.ships.splice(index, 1);
        this.element.removeChild(ship.element);
    };
    this.canFit = function(ship) {
        const x = ship.x;
        const y = ship.y;
        if (x < 0) return false;
        if (y < 0) return false;
        const right = x + ship.getSizeX() - 1;
        const bottom = y + ship.getSizeY() - 1;
        if (right >= this.size) return false;
        if (bottom >= this.size) return false;
        for (let i = 0; i < this.ships.length; ++i) {
            const placed = this.ships[i];
            const placedX = placed.x - 1;
            const placedY = placed.y - 1;
            const placedRight = placed.x + placed.getSizeX();
            const placedBottom = placed.y + placed.getSizeY();
            if (x <= placedRight && y <= placedBottom && right >= placedX && bottom >= placedY)
                return false;
        }
        return true;
    };
    this._onmousemove = function(e) {
        const bounds = this.gridElement.getBoundingClientRect();
        const pixelsX = e.pageX - bounds.left;
        const pixelsY = e.pageY - bounds.top;
        let x = Math.round(pixelsX / bounds.width * this.size - 0.5);
        let y = Math.round(pixelsY / bounds.height * this.size - 0.5);
        x = clamp(x, 0, this.size - 1);
        y = clamp(y, 0, this.size - 1);
        if (this.onMouseMove) {
            this.onMouseMove(x, y);
        }
        this.mouseX = x;
        this.mouseY = y;
    };
    this._onmousedown = function(e) {
        if (this.onMouseDown) {
            this.onMouseDown(e, this.mouseX, this.mouseY);
        }
    };
    this.reset(size);
}

function Fleet(shipSizes, styleClass) {
    this.size = 0;
    this.element = document.createElement('div');
    this.element.classList.add('fleet');
    if (styleClass)
        this.element.classList.add(styleClass);
    this.ships = [];
    this.selected = null;

    this.reset = function(shipSizes) {
        this.ships = [];
        this.element.textContent = '';

        this.size = shipSizes.length;
        let previousSize = 0;
        for (let i = 0; i < shipSizes.length; ++i) {
            const shipSize = shipSizes[i];
            if (previousSize !== 0 && previousSize !== shipSize) {
                this.element.appendChild(document.createElement('br'));
            }
            const ship = new Ship(shipSize);
            this.element.appendChild(ship.element);
            this.ships.push(ship);
            previousSize = shipSize;
        }
    };
    this.select = function(index) {
        if (this.selected != null) {
            this.ships[this.selected].setSelected(false);
        }
        this.selected = index;
        if (this.selected == null) return null;

        const ship = this.ships[index];
        ship.setSelected(true);
        return ship;
    };
    this.reset(shipSizes);
    this.select(null);
}

function Placer(callbacks) {
    const self = this;
    this.field = new Field(0, 'field-placing');
    this.fleet = new Fleet([], 'fleet-placing');
    this.grabIndex = 0;
    this.grabVertical = false;
    this.grabOffset = 0;  // TODO Implement it
    this.placedShips = [];
    this.allPlaced = false;

    this.preview = new Ship(1, 'preview');
    this.preview.disableMouseEvents();
    this.preview.hide();
    this.field.element.appendChild(this.preview.element);

    this.field.onMouseMove = function(x, y) {self._onGridMouseMove(x, y)};
    this.field.gridElement.onmouseleave = function() {
        self.preview.hide();
    };
    this.field.onMouseDown = function(e, x, y) {
        if (e.button === 0) {
            self._placeCurrentShip();
        }
        if (e.button === 2) {
            self._toggleVertical();
        }
    };

    this.reset = function(battle) {
        this.field.reset(battle.fieldSize);
        this.fleet.reset(battle.shipSizes);
        this.placedShips = [];
        for (let i = 0; i < this.fleet.size; ++i) {
            const ship = this.fleet.ships[i];
            ship.element.onmousedown = function(e) {
                if (e.button === 0) {
                    self._grabShip(i);
                }
            };
            this.placedShips.push(null);
        }
        this._grabShip(0);
        this.preview.hide();
        this.preview.setCellSize(this.field.gridElement.offsetWidth / this.field.size);
    };
    this._onGridMouseMove = function(x, y) {
        if (!this.allPlaced) {
            this.preview.setPosition(x, y);
            this.preview.show();
            this._validatePreview();
        }
    };
    this._toggleVertical = function() {
        this.grabVertical = !this.grabVertical;
        this.preview.setVertical(this.grabVertical);
        this._validatePreview();
    };
    this._grabShip = function(index) {
        const fleetShip = this.fleet.select(index);
        this.grabIndex = index;
        if (index == null) {
            this.preview.hide();
        }
        else {
            const placedShip = this.placedShips[index];
            if (placedShip) {
                this.grabVertical = placedShip.vertical;
                this.preview.setPosition(placedShip.x, placedShip.y);
                this._unplaceShip(index);
            }
            this.preview.setVertical(this.grabVertical);
            this.preview.setSize(fleetShip.size);
            this._validatePreview();
        }
    };
    this._placeCurrentShip = function() {
        if (this.grabIndex === null) return;
        if (this.preview.invalid) return;
        const x = this.preview.x;
        const y = this.preview.y;
        this._placeShip(this.grabIndex, x, y, this.grabVertical);
        const nextShipToPlace = this._decideNextShipToPlace();
        this._grabShip(nextShipToPlace);
        this._setAllPlaced(nextShipToPlace === null);
    };
    this._decideNextShipToPlace = function() {
        for (let i = 0; i < this.fleet.size; ++i) {
            const nextShipToPlace = (this.grabIndex + i) % this.fleet.size;
            if (!this.placedShips[nextShipToPlace]) {
                return nextShipToPlace;
            }
        }
        return null;
    };
    this._placeShip = function(shipIndex, x, y, vertical) {
        const fleetShip = this.fleet.ships[shipIndex];
        fleetShip.setPlaced(true);
        const placedShip = new Ship(fleetShip.size);
        this.placedShips[shipIndex] = placedShip;
        placedShip.setPosition(x, y);
        placedShip.setVertical(vertical);
        const self = this;
        placedShip.element.onmousedown = function(e) {
            if (e.button === 0) {
                self._grabShip(shipIndex);
            }
        };
        this.field.addShip(placedShip);
    };
    this._unplaceShip = function(index) {
        const placedShip = this.placedShips[index];
        if (!placedShip) return;
        this.fleet.ships[index].setPlaced(false);
        this.field.removeShip(placedShip);
        this.placedShips[index] = null;
        this._setAllPlaced(false);
        this.preview.show();
        this._validatePreview();
    };
    this._validatePreview = function() {
        const isValid = this.field.canFit(this.preview);
        this.preview.setInvalid(!isValid);
    };
    this._setAllPlaced = function(allPlaced) {
        this.allPlaced = allPlaced;
        callbacks.allPlaced(allPlaced);
    };
}

function BattleController(callbacks) {
    const self = this;
    this.fields = [
        new Field(0, 'field-1'),
        new Field(0, 'field-2'),
    ];
    this.fleets = [
        new Fleet([], 'fleet-1'),
        new Fleet([], 'fleet-2'),
    ];

    this.reset = function(battle, player) {
        this.battle = battle;
        this.player = player;
        this.enemy = player === 0 ? 1 : 0;
        for (let i = 0; i < this.fields.length; ++i) {
            this.fields[i].reset(battle.fieldSize);
            this.fields[i].element.classList.remove('field-1');
            this.fields[i].element.classList.remove('field-2');
            this.fleets[i].reset(battle.shipSizes);
            this.fleets[i].element.classList.remove('fleet-1');
            this.fleets[i].element.classList.remove('fleet-2');
        }
        this.fields[this.player].element.classList.add('field-1');
        this.fields[this.enemy].element.classList.add('field-2');
        this.fleets[this.player].element.classList.add('fleet-1');
        this.fleets[this.enemy].element.classList.add('fleet-2');
        this.fields[this.player].onMouseDown = null;
        this.fields[this.enemy].onMouseDown = function (e, x, y) {
            callbacks.shoot(self.enemy, x, y);
        };
    };
    this.setPlayerShips = function(ships) {
        for (let i = 0; i < ships.length; ++i) {
            const playerShip = ships[i];
            const ship = new Ship(playerShip.size);
            ship.setPosition(playerShip.x, playerShip.y);
            this.fields[this.player].addShip(ship);
        }
    };
}

ui = {
    mainMenuScreen: document.getElementById('mainMenuScreen'),
    startBattleButton: document.getElementById('startBattle'),
    startBotBattleButton: document.getElementById('startBotBattle'),
    placingShipsScreen: document.getElementById('placingShipsScreen'),
    placeShipsButton: document.getElementById('placeShips'),
    resetFieldButton: document.getElementById('resetField'),
    placingGrid: document.querySelector('#placingShipsScreen .field-grid'),
    leaveBattleButton: document.getElementById('leaveBattle'),
    loader: document.getElementById('loader'),
    loaderText: document.getElementById('loaderText'),
    battleScreen: document.getElementById('battleScreen'),
    battle: null,
    start: function(callbacks) {
        const self = this;
        this.callbacks = callbacks;

        this.placer = new Placer({
            allPlaced: function(allPlaced) {
                if (allPlaced) {
                    self.placeShipsButton.classList.add('revealed');
                }
                else {
                    self.placeShipsButton.classList.remove('revealed');
                }
            },
        });
        this.placingShipsScreen.appendChild(this.placer.field.element);
        this.placingShipsScreen.appendChild(this.placer.fleet.element);

        this.battleController = new BattleController({
            shoot: callbacks.shoot,
        });
        this.battleScreen.appendChild(this.battleController.fields[0].element);
        this.battleScreen.appendChild(this.battleController.fields[1].element);
        this.battleScreen.appendChild(this.battleController.fleets[0].element);
        this.battleScreen.appendChild(this.battleController.fleets[1].element);

        this.startBattleButton.onclick = callbacks.startBattle;
        this.leaveBattleButton.onclick = callbacks.leaveBattle;
        this.resetFieldButton.onclick = function() {self.placer.reset(self.battle)};
        this.placeShipsButton.onclick = function() {self._placeShips()};
    },
    showLoader: function(text) {
        ui.loader.classList.add('active');
        ui.loaderText.textContent = text;
    },
    hideLoader: function() {
        ui.loader.classList.remove('active');
    },
    showBattle: function() {
        ui.placingShipsScreen.classList.remove('active');
        ui.battleScreen.classList.add('active');
    },
    joinBattle: function(battle, player) {
        this.battle = battle;
        this.hideLoader();
        this.placeShipsButton.classList.remove('revealed');
        this.placingShipsScreen.classList.add('active');
        this.placer.reset(battle);
        this.battleController.reset(battle, player);
    },
    _placeShips: function() {
        this.callbacks.placeShips(this.placer.placedShips);
        this.showBattle();
        this.battleController.setPlayerShips(this.placer.placedShips);
    },
};

server = {
    connect: function(callbacks) {
        this.callbacks = callbacks;
        const protocol = location.protocol === "https:" ? "wss" : "ws";
        this.ws = new WebSocket(protocol + '://' + location.host + '/ws');
        this.ws.onopen = this.callbacks.connected;
        this.ws.onmessage = function(event) {server.onMessage(event);}
    },
    startBattle: function() {
        this.send({startBattle: {}});
    },
    placeShips: function(ships) {
        this.send({placeShips: {ships: ships}});
    },
    shoot: function(target, x, y) {
        this.send({shoot: {target: target, x: x, y: y}})
    },
    send: function(obj) {
        this.ws.send(JSON.stringify(obj));
    },
    onMessage: function(event) {
        console.log(this);
        const serverMessage = JSON.parse(event.data);
        if (serverMessage.joinedToBattle) {
            this.callbacks.joinedToBattle(serverMessage.joinedToBattle);
        }
        if (serverMessage.battleUpdate) {
            this.callbacks.battleUpdate(serverMessage.battleUpdate);
        }
        if (serverMessage.shot) {
            this.callbacks.shot(serverMessage.shot);
        }
    },
};

game = {
    start: function() {
        ui.start({
            startBattle: this.startBattle,
            leaveBattle: this.leaveBattle,
            placeShips: this.placeShips,
            shoot: this.shoot,
        });
        ui.showLoader("Connecting to the server...");
        server.connect({
            connected: this.onConnectedToServer,
            joinedToBattle: this.onJoinedToBattle,
            battleUpdate: this.onBattleUpdate,
            shot: this.onShot,
        });
    },
    // Server events
    onConnectedToServer: function() {
        ui.hideLoader();
        ui.mainMenuScreen.classList.add('active');
    },
    onJoinedToBattle: function(joinedBattleEvent) {
        const battle = {
            playerCount: joinedBattleEvent.playerCount,
            fieldSize: joinedBattleEvent.fieldSize,
            shipSizes: joinedBattleEvent.shipSizes.sort(),
        };
        ui.joinBattle(battle, joinedBattleEvent.player);
        ui.leaveBattleButton.classList.add('revealed');
    },
    onBattleUpdate: function() {

    },
    onShot: function() {

    },
    // UI events
    startBattle: function() {
        ui.mainMenuScreen.classList.remove('active');
        ui.showLoader("Waiting for a battle...");
        server.startBattle();
    },
    leaveBattle: function() {
        ui.battleScreen.classList.remove('active');
        ui.placingShipsScreen.classList.remove('active');
        ui.mainMenuScreen.classList.add('active');
        ui.leaveBattleButton.classList.remove('revealed');
        // TODO leave the battle or reconnect websocket
    },
    placeShips: function(ships) {
        const commandShips = [];
        for (let i = 0; i < ships.length; ++i) {
            const ship = ships[i];
            commandShips.push({
               x: ship.x,
               y: ship.y,
               vertical: ship.vertical,
               size: ship.size,
            });
        }
        server.placeShips(commandShips);
    },
    shoot: function(target, x, y) {
        server.shoot(target, x, y)
    }
};

game.start();
