/*
Гибель от одиночества: Если на клетке есть фишка, и на соседних клетках менее двух фишек, то фишка гибнет (снимается с поля).
Гибель от перенаселения: Если на клетке есть фишка, и на соседних клетках более трех фишек, то фишка гибнет (снимается с поля).
Рождение: Если на клетке нет фишки, и на соседних клетках ровно три фишки, то на клетке рождается фишка (ставится на поле).
*/
(function () {
  var GOL = {
    columns: 50,
    rows: 50,
    cellSize: 10,
    generation: 0,
    running: false,
    initialState: "[]",
    clear: false,

    // DOM elements
    element: {
      generation: null,
      livecells: null,
    },
    colors: {
      dead: "#65799B",
      alive: "#E23E57",
      grid: "#555273",
    },

    init: function () {
      try {
        this.loadState(); // Load state from URL
        this.keepDOMElements(); // Keep DOM References (getElementsById)
        this.canvas.init(); // Init canvas GUI
        this.registerEvents(); // Register event handlers
        this.prepare();
      } catch (e) {
        alert("Error: " + e);
      }
    },

    loadState: function () {
      var s = this.helpers.getUrlParameter("s");
      if (s === "random") this.randomState();
      else s = this.initialState;
    },

    randomState: function () {
      var i,
        liveCells = this.rows * this.columns * 0.2;

      for (i = 0; i < liveCells; i++) {
        this.listLife.addCell(
          this.helpers.random(0, this.columns - 1),
          this.helpers.random(0, this.rows - 1),
          this.listLife.actualState
        );
      }

      this.listLife.nextGeneration();
    },

    cleanUp: function () {
      this.listLife.init();
      this.prepare();
    },

    prepare: function () {
      this.generation = 0;
      this.mouseDown = this.clear = false;

      this.element.generation.innerHTML = "0";
      this.element.livecells.innerHTML = "0";

      this.canvas.clearWorld(); // Reset GUI
      this.canvas.drawWorld(); // Draw State
    },

    keepDOMElements: function () {
      this.element.generation = document.getElementById("generation");
      this.element.livecells = document.getElementById("livecells");
    },

    registerEvents: function () {
      this.helpers.registerEvent(
        document.getElementById("buttonRun"),
        "click",
        this.handlers.buttons.run,
        false
      );
      this.helpers.registerEvent(
        document.getElementById("buttonStep"),
        "click",
        this.handlers.buttons.step,
        false
      );
      this.helpers.registerEvent(
        document.getElementById("buttonClear"),
        "click",
        this.handlers.buttons.clear,
        false
      );
    },

    nextStep: function () {
      var i, x, y, r, liveCellNumber;

      // Algorithm run
      liveCellNumber = this.listLife.nextGeneration();

      // Canvas run

      for (i = 0; i < this.listLife.redrawList.length; i++) {
        x = this.listLife.redrawList[i][0];
        y = this.listLife.redrawList[i][1];

        if (this.listLife.redrawList[i][2] === 1) {
          this.canvas.changeCelltoAlive(x, y);
        } else if (this.listLife.redrawList[i][2] === 2) {
          this.canvas.keepCellAlive(x, y);
        } else {
          this.canvas.changeCelltoDead(x, y);
        }
      }

      // Running Information
      this.generation++;
      this.element.generation.innerHTML = this.generation;
      this.element.livecells.innerHTML = liveCellNumber;

      // Flow Control
      if (this.running) {
        setTimeout(function () {
          GOL.nextStep();
        }, 0);
      } else {
        if (this.clear) {
          this.cleanUp();
        }
      }
    },

    handlers: {
      mouseDown: false,
      lastX: 0,
      lastY: 0,

      canvasMouseDown: function (event) {
        var position = GOL.helpers.mousePosition(event);
        GOL.canvas.switchCell(position[0], position[1]);
        GOL.handlers.lastX = position[0];
        GOL.handlers.lastY = position[1];
        GOL.handlers.mouseDown = true;
      },

      canvasMouseUp: function () {
        GOL.handlers.mouseDown = false;
      },

      buttons: {
        run: function () {
          GOL.running = !GOL.running;
          if (GOL.running) {
            GOL.nextStep();
            document.getElementById("buttonRun").value = "Stop";
          } else {
            document.getElementById("buttonRun").value = "Run";
          }
        },

        step: function () {
          if (!GOL.running) {
            GOL.nextStep();
          }
        },

        clear: function () {
          if (GOL.running) {
            GOL.clear = true;
            GOL.running = false;
            document.getElementById("buttonRun").value = "Run";
          } else {
            GOL.cleanUp();
          }
        },
      },
    },

    canvas: {
      context: null,
      width: null,
      height: null,
      age: null,
      cellSize: null,
      cellSpace: null,

      init: function () {
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.cellSize = GOL.cellSize;
        this.cellSpace = 1;

        GOL.helpers.registerEvent(
          this.canvas,
          "mousedown",
          GOL.handlers.canvasMouseDown,
          false
        );
        GOL.helpers.registerEvent(
          document,
          "mouseup",
          GOL.handlers.canvasMouseUp,
          false
        );

        this.clearWorld();
      },

      /**
       * clearWorld
       */
      clearWorld: function () {
        var i, j;

        // Init ages (Canvas reference)
        this.age = [];
        for (i = 0; i < GOL.columns; i++) {
          this.age[i] = [];
          for (j = 0; j < GOL.rows; j++) {
            this.age[i][j] = 0; // Dead
          }
        }
      },

      /**
       * drawWorld
       */
      drawWorld: function () {
        var i, j;
        this.width = this.height = 1;
        // Dynamic canvas size
        this.width =
          this.width +
          this.cellSpace * GOL.columns +
          this.cellSize * GOL.columns;
        this.canvas.setAttribute("width", this.width);

        this.height =
          this.height + this.cellSpace * GOL.rows + this.cellSize * GOL.rows;
        this.canvas.getAttribute("height", this.height);

        // Fill background
        this.context.fillStyle = GOL.colors.grid;
        this.context.fillRect(0, 0, this.width, this.height);

        for (i = 0; i < GOL.columns; i++) {
          for (j = 0; j < GOL.rows; j++) {
            if (GOL.listLife.isAlive(i, j)) {
              this.drawCell(i, j, true);
            } else {
              this.drawCell(i, j, false);
            }
          }
        }
      },

      /**
       * drawCell
       */
      drawCell: function (i, j, alive) {
        if (alive) {
          if (this.age[i][j] > -1) this.context.fillStyle = GOL.colors.alive;
        } else {
          this.context.fillStyle = GOL.colors.dead;
        }

        this.context.fillRect(
          this.cellSpace + this.cellSpace * i + this.cellSize * i,
          this.cellSpace + this.cellSpace * j + this.cellSize * j,
          this.cellSize,
          this.cellSize
        );
      },

      /**
       * switchCell
       */
      switchCell: function (i, j) {
        if (GOL.listLife.isAlive(i, j)) {
          this.changeCelltoDead(i, j);
          GOL.listLife.removeCell(i, j, GOL.listLife.actualState);
        } else {
          this.changeCelltoAlive(i, j);
          GOL.listLife.addCell(i, j, GOL.listLife.actualState);
        }
      },

      /**
       * keepCellAlive
       */
      keepCellAlive: function (i, j) {
        if (i >= 0 && i < GOL.columns && j >= 0 && j < GOL.rows) {
          this.age[i][j]++;
          this.drawCell(i, j, true);
        }
      },

      /**
       * changeCelltoAlive
       */
      changeCelltoAlive: function (i, j) {
        if (i >= 0 && i < GOL.columns && j >= 0 && j < GOL.rows) {
          this.age[i][j] = 1;
          this.drawCell(i, j, true);
        }
      },

      /**
       * changeCelltoDead
       */
      changeCelltoDead: function (i, j) {
        if (i >= 0 && i < GOL.columns && j >= 0 && j < GOL.rows) {
          this.age[i][j] = -this.age[i][j]; // Keep trail
          this.drawCell(i, j, false);
        }
      },
    },

    /** ****************************************************************************************************************************
     *
     */
    listLife: {
      actualState: [],
      redrawList: [],

      init: function () {
        this.actualState = [];
      },

      nextGeneration: function () {
        var x,
          y,
          i,
          j,
          m,
          n,
          key,
          t1,
          t2,
          alive = 0,
          neighbours,
          deadNeighbours,
          allDeadNeighbours = {},
          newState = [];
        this.redrawList = [];

        for (i = 0; i < this.actualState.length; i++) {
          this.topPointer = 1;
          this.bottomPointer = 1;

          for (j = 1; j < this.actualState[i].length; j++) {
            x = this.actualState[i][j];
            y = this.actualState[i][0];

            // Possible dead neighbours
            deadNeighbours = [
              [x - 1, y - 1, 1],
              [x, y - 1, 1],
              [x + 1, y - 1, 1],
              [x - 1, y, 1],
              [x + 1, y, 1],
              [x - 1, y + 1, 1],
              [x, y + 1, 1],
              [x + 1, y + 1, 1],
            ];

            // Get number of live neighbours and remove alive neighbours from deadNeighbours
            neighbours = this.getNeighboursFromAlive(x, y, i, deadNeighbours);

            // Join dead neighbours to check list
            for (m = 0; m < 8; m++) {
              if (deadNeighbours[m] !== undefined) {
                key = deadNeighbours[m][0] + "," + deadNeighbours[m][1]; // Create hashtable key

                if (allDeadNeighbours[key] === undefined) {
                  allDeadNeighbours[key] = 1;
                } else {
                  allDeadNeighbours[key]++;
                }
              }
            }

            if (!(neighbours === 0 || neighbours === 1 || neighbours > 3)) {
              this.addCell(x, y, newState);
              alive++;
              this.redrawList.push([x, y, 2]); // Keep alive
            } else {
              this.redrawList.push([x, y, 0]); // Kill cell
            }
          }
        }

        // Process dead neighbours
        for (key in allDeadNeighbours) {
          if (allDeadNeighbours[key] === 3) {
            // Add new Cell
            key = key.split(",");
            t1 = parseInt(key[0], 10);
            t2 = parseInt(key[1], 10);

            this.addCell(t1, t2, newState);
            alive++;
            this.redrawList.push([t1, t2, 1]);
          }
        }

        this.actualState = newState;

        return alive;
      },

      topPointer: 1,
      middlePointer: 1,
      bottomPointer: 1,

      getNeighboursFromAlive: function (x, y, i, possibleNeighboursList) {
        var neighbours = 0,
          k;

        // Top
        if (this.actualState[i - 1] !== undefined) {
          if (this.actualState[i - 1][0] === y - 1) {
            for (k = this.topPointer; k < this.actualState[i - 1].length; k++) {
              if (this.actualState[i - 1][k] >= x - 1) {
                if (this.actualState[i - 1][k] === x - 1) {
                  possibleNeighboursList[0] = undefined;
                  this.topPointer = k + 1;
                  neighbours++;
                }

                if (this.actualState[i - 1][k] === x) {
                  possibleNeighboursList[1] = undefined;
                  this.topPointer = k;
                  neighbours++;
                }

                if (this.actualState[i - 1][k] === x + 1) {
                  possibleNeighboursList[2] = undefined;

                  if (k == 1) {
                    this.topPointer = 1;
                  } else {
                    this.topPointer = k - 1;
                  }

                  neighbours++;
                }

                if (this.actualState[i - 1][k] > x + 1) {
                  break;
                }
              }
            }
          }
        }

        // Middle
        for (k = 1; k < this.actualState[i].length; k++) {
          if (this.actualState[i][k] >= x - 1) {
            if (this.actualState[i][k] === x - 1) {
              possibleNeighboursList[3] = undefined;
              neighbours++;
            }

            if (this.actualState[i][k] === x + 1) {
              possibleNeighboursList[4] = undefined;
              neighbours++;
            }

            if (this.actualState[i][k] > x + 1) {
              break;
            }
          }
        }

        // Bottom
        if (this.actualState[i + 1] !== undefined) {
          if (this.actualState[i + 1][0] === y + 1) {
            for (
              k = this.bottomPointer;
              k < this.actualState[i + 1].length;
              k++
            ) {
              if (this.actualState[i + 1][k] >= x - 1) {
                if (this.actualState[i + 1][k] === x - 1) {
                  possibleNeighboursList[5] = undefined;
                  this.bottomPointer = k + 1;
                  neighbours++;
                }

                if (this.actualState[i + 1][k] === x) {
                  possibleNeighboursList[6] = undefined;
                  this.bottomPointer = k;
                  neighbours++;
                }

                if (this.actualState[i + 1][k] === x + 1) {
                  possibleNeighboursList[7] = undefined;

                  if (k == 1) {
                    this.bottomPointer = 1;
                  } else {
                    this.bottomPointer = k - 1;
                  }

                  neighbours++;
                }

                if (this.actualState[i + 1][k] > x + 1) {
                  break;
                }
              }
            }
          }
        }

        return neighbours;
      },

      /**
       *
       */
      isAlive: function (x, y) {
        var i, j;

        for (i = 0; i < this.actualState.length; i++) {
          if (this.actualState[i][0] === y) {
            for (j = 1; j < this.actualState[i].length; j++) {
              if (this.actualState[i][j] === x) {
                return true;
              }
            }
          }
        }
        return false;
      },

      removeCell: function (x, y, state) {
        var i, j;

        for (i = 0; i < state.length; i++) {
          if (state[i][0] === y) {
            if (state[i].length === 2) {
              // Remove all Row
              state.splice(i, 1);
            } else {
              // Remove Element
              for (j = 1; j < state[i].length; j++) {
                if (state[i][j] === x) {
                  state[i].splice(j, 1);
                }
              }
            }
          }
        }
      },

      addCell: function (x, y, state) {
        if (state.length === 0) {
          state.push([y, x]);
          return;
        }

        var k,
          n,
          m,
          tempRow,
          newState = [],
          added;

        if (y < state[0][0]) {
          // Add to Head
          newState = [[y, x]];
          for (k = 0; k < state.length; k++) {
            newState[k + 1] = state[k];
          }

          for (k = 0; k < newState.length; k++) {
            state[k] = newState[k];
          }

          return;
        } else if (y > state[state.length - 1][0]) {
          // Add to Tail
          state[state.length] = [y, x];
          return;
        } else {
          // Add to Middle

          for (n = 0; n < state.length; n++) {
            if (state[n][0] === y) {
              // Level Exists
              tempRow = [];
              added = false;
              for (m = 1; m < state[n].length; m++) {
                if (!added && x < state[n][m]) {
                  tempRow.push(x);
                  added = !added;
                }
                tempRow.push(state[n][m]);
              }
              tempRow.unshift(y);
              if (!added) {
                tempRow.push(x);
              }
              state[n] = tempRow;
              return;
            }

            if (y < state[n][0]) {
              // Create Level
              newState = [];
              for (k = 0; k < state.length; k++) {
                if (k === n) {
                  newState[k] = [y, x];
                  newState[k + 1] = state[k];
                } else if (k < n) {
                  newState[k] = state[k];
                } else if (k > n) {
                  newState[k + 1] = state[k];
                }
              }

              for (k = 0; k < newState.length; k++) {
                state[k] = newState[k];
              }

              return;
            }
          }
        }
      },
    },

    /** ****************************************************************************************************************************
     *
     */
    helpers: {
      urlParameters: null, // Cache
      random: function (min, max) {
        return min <= max
          ? min + Math.round(Math.random() * (max - min))
          : null;
      },
      getUrlParameter: function (name) {
        if (this.urlParameters === null) {
          var hash, hashes, i;

          this.urlParameters = [];
          hashes = window.location.href
            .slice(window.location.href.indexOf("?") + 1)
            .split("&");

          for (i = 0; i < hashes.length; i++) {
            hash = hashes[i].split("=");
            this.urlParameters.push(hash[0]);
            this.urlParameters[hash[0]] = hash[1];
          }
        }

        return this.urlParameters[name];
      },

      registerEvent: function (element, event, handler, capture) {
        if (/msie/i.test(navigator.userAgent)) {
          element.attachEvent("on" + event, handler);
        } else {
          element.addEventListener(event, handler, capture);
        }
      },

      mousePosition: function (e) {
        // http://www.malleus.de/FAQ/getImgMousePos.html
        // http://www.quirksmode.org/js/events_properties.html#position
        var event,
          x,
          y,
          domObject,
          posx = 0,
          posy = 0,
          top = 0,
          left = 0,
          cellSize = GOL.cellSize + 1;

        event = e;
        if (!event) {
          event = window.event;
        }

        if (event.pageX || event.pageY) {
          posx = event.pageX;
          posy = event.pageY;
        } else if (event.clientX || event.clientY) {
          posx =
            event.clientX +
            document.body.scrollLeft +
            document.documentElement.scrollLeft;
          posy =
            event.clientY +
            document.body.scrollTop +
            document.documentElement.scrollTop;
        }

        domObject = event.target || event.srcElement;

        while (domObject.offsetParent) {
          left += domObject.offsetLeft;
          top += domObject.offsetTop;
          domObject = domObject.offsetParent;
        }

        domObject.pageTop = top;
        domObject.pageLeft = left;

        x = Math.ceil((posx - domObject.pageLeft) / cellSize - 1);
        y = Math.ceil((posy - domObject.pageTop) / cellSize - 1);

        return [x, y];
      },
    },
  };

  GOL.helpers.registerEvent(
    window,
    "load",
    function () {
      GOL.init();
    },
    false
  );
})();
