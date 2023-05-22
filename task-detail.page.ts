import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NavigationService} from "../../providers/navigation.service";
import {NavParamProviderService} from "../../providers/nav-param-provider.service";
import {DroneAction, Task} from "../../interfaces/task";
import {AlertController, ModalController, PopoverController} from "@ionic/angular";
import {StorageService} from "../../providers/storage.service";
import Blockly from 'blockly';
import {BlockSvg, WorkspaceSvg} from "blockly/blockly";
import * as BlocklyJS from 'blockly/javascript';
import {BlocklyService} from "../../providers/blockly.service";
import {TranslateService} from "@ngx-translate/core";
import {PhotoViewer} from "@ionic-native/photo-viewer/ngx";
import {Hint} from "../../interfaces/hint";
import {Path} from "../../interfaces/path";
import {ArPreviewPage} from "../ar-preview/ar-preview-page.component";

export enum TaskFamilies {
  cubes = "building_cubes.task_family",
  drone = "drone_task_family"
}

export enum AssignmentTypes {
  cube_implementation = "assignmenttype_building_cubes_implement",
  drone_implementation = "assignmenttype_drone_implement"
}


@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
})
export class TaskDetailPage implements OnInit, AfterViewInit {
  @ViewChild('blocklyContainer') blocklyContainer: ElementRef;
  @ViewChild('blocklyDiv') blocklyDiv: ElementRef;
  task: Task;
  taskIndex = 0;
  path: Path;
  solution = "";
  blocklyWorkspace: WorkspaceSvg;
  showDetails = true;

  constructor(
    public nav: NavigationService,
    private navParams: NavParamProviderService,
    private popoverCtrl: PopoverController,
    private storage: StorageService,
    private blocklyService: BlocklyService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private photoViewer: PhotoViewer,
    private modalCtrl: ModalController
  ) {
  }

  ngOnInit() {
    this.task = this.navParams.getTask();
    this.path = this.navParams.getPath();
    this.taskIndex = this.navParams.getTaskIndex();
    console.log('Task:', this.task);
    if (!this.task) {
      this.goBack();
    }
  }

  ngAfterViewInit() {
    this.initBlockly();
  }

  initBlockly() {
    const zoomOptions = {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
      pinch: true
    };

    if (this.task.type === TaskFamilies.cubes) {
      this.blocklyService.initCustomCodeBlocksForCubeTask();
      if (this.task.solved) {
        this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
          readOnly: true,
          zoom: zoomOptions,
          move: {drag: true, scrollbars: true, wheel: true},
          theme: this.blocklyService.theme
        });
      } else if (this.task.details.codingTaskType === AssignmentTypes.cube_implementation) {
        this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
          toolbox: this.blocklyService.getToolboxForType(this.task.type),
          zoom: zoomOptions,
          toolboxPosition: 'start',
          horizontalLayout: true,
          theme: this.blocklyService.theme
        });


        const newBlock: BlockSvg = this.blocklyWorkspace.newBlock('blocks_init') as BlockSvg;
        newBlock.initSvg();
        newBlock.render();

      } else if (this.task.details.codingTaskType === 'parsonsPuzzle') {
        this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
          zoom: zoomOptions,
          move: {drag: true, scrollbars: true, wheel: true},
          theme: this.blocklyService.theme
        });
        const workspaceDom = Blockly.Xml.textToDom(this.task.details.initialBlocks);
        Blockly.Xml.domToWorkspace(workspaceDom, this.blocklyWorkspace);
      } else {
        this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
          zoom: zoomOptions,
          toolbox: this.blocklyService.getToolboxForType(this.task.type),
          toolboxPosition: 'start',
          horizontalLayout: true,
          theme: this.blocklyService.theme
        });
        const workspaceDom = Blockly.Xml.textToDom(this.task.details.initialBlocks);
        Blockly.Xml.domToWorkspace(workspaceDom, this.blocklyWorkspace);
      }
      setTimeout(() => {
        this.redrawBlocklyArea();
      }, 10);
    }
    if (this.task.type === TaskFamilies.drone) {
      this.blocklyService.initCustomBlocksForDroneTask();
      if (this.task.solved) {
        this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
          zoom: zoomOptions,
          readOnly: true,
          move: {drag: true, scrollbars: true, wheel: true},
          theme: this.blocklyService.theme
        });
      } else if (this.task.details.codingTaskType === AssignmentTypes.drone_implementation) {
        this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
          zoom: zoomOptions,
          toolbox: this.blocklyService.getToolboxForType(this.task.type),
          toolboxPosition: 'start',
          horizontalLayout: true,
          theme: this.blocklyService.theme
        });
        const newBlock: BlockSvg = this.blocklyWorkspace.newBlock('drone_init') as BlockSvg;
        newBlock.initSvg();
        newBlock.render();
        // } else if (this.task.details.codingTaskType === 'parsonsPuzzle') {
        //   this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
        //     zoom: zoomOptions,
        //     move: {drag: true, scrollbars: true, wheel: true},
        //     theme: this.blocklyService.theme
        //   });
        //   const workspaceDom = Blockly.Xml.textToDom(this.task.details.initialBlocks);
        //   Blockly.Xml.domToWorkspace(workspaceDom, this.blocklyWorkspace);
        // } else {
        //   this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.nativeElement, {
        //     zoom: zoomOptions,
        //     toolbox: this.blocklyService.getToolboxForType(this.task.type),
        //     toolboxPosition: 'start',
        //     horizontalLayout: true,
        //     theme: this.blocklyService.theme
        //   });
        //   const workspaceDom = Blockly.Xml.textToDom(this.task.details.initialBlocks);
        //   Blockly.Xml.domToWorkspace(workspaceDom, this.blocklyWorkspace);
      }
      setTimeout(() => {
        this.redrawBlocklyArea();
      }, 10);
    }
    if (this.task.solution) {
      const solutionDom = Blockly.Xml.textToDom(this.task.solution);
      Blockly.Xml.clearWorkspaceAndLoadFromXml(solutionDom, this.blocklyWorkspace);
    }
  }

  redrawBlocklyArea() {
    let element: HTMLElement = this.blocklyContainer.nativeElement;
    let x = 0;
    let y = 0;
    do {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = undefined;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    this.blocklyDiv.nativeElement.style.left = x + 'px';
    this.blocklyDiv.nativeElement.style.top = y + 'px';
    this.blocklyDiv.nativeElement.style.width = this.blocklyContainer.nativeElement.offsetWidth + 'px';
    this.blocklyDiv.nativeElement.style.height = this.blocklyContainer.nativeElement.offsetHeight + 'px';
    Blockly.svgResize(this.blocklyWorkspace);
  }

  goBack() {
    if (this.blocklyWorkspace) {
      const solutionDOM = Blockly.Xml.workspaceToDom(this.blocklyWorkspace);
      this.task.solution = Blockly.Xml.domToText(solutionDOM);
    }

    this.storage.updateTask(this.task).then(() => {
      this.nav.pop();
    });
  }

  getUserSolution() {
    let result;
    if (this.blocklyWorkspace) {
      const code = BlocklyJS.workspaceToCode(this.blocklyWorkspace);
      if (this.task.type === TaskFamilies.cubes) {
        if (code.includes('let blocks=[];')) {
          const evalFnc = new Function(code + "return blocks;");
          result = evalFnc();
          return result;
        }
      }
      if (this.task.type === TaskFamilies.drone) {
        if (code.includes('let actions=[];')) {
          const evalFnc = new Function(code + 'return {actions: actions, movement: movement, position: position};');
          result = evalFnc();
          console.log('DRONE RESULT', result);
          return result;
        }
      }
    }
    return [];
  }

  async solveTask() {
    //TODO: Check with Tim what auto-validate should be until then remove if statement
    // if (this.task.autoValidate) {
    let solvedCorrectly = false;
    let result;
    let solution;
    if (this.blocklyWorkspace) {
      const solutionDOM = Blockly.Xml.workspaceToDom(this.blocklyWorkspace);
      solution = Blockly.Xml.domToText(solutionDOM);
      const code = BlocklyJS.workspaceToCode(this.blocklyWorkspace);
      if (this.task.type === TaskFamilies.cubes) {
        if (code.includes('let blocks=[];')) {
          try {
            result = this.getUserSolution();
            if (result.length === this.task.details.cubeCoords.length) {
              const matchFunction = function (entryOne, entryTwo) {
                return entryOne[0] === entryTwo[0] && entryOne[1] === entryTwo[1] && entryOne[2] === entryTwo[2];
              };
              solvedCorrectly = this.checkArrayResultWithMatchFunction(result, this.task.details.cubeCoords, matchFunction);
            }
            //@ts-ignore
            console.log('Code eval result', result);
          } catch (e) {
            console.error(e);
          }
        }
      } else if (this.task.type === TaskFamilies.drone) {
        if (code.includes('let actions=[];')) {
          try {
            result = this.getUserSolution().actions;
            if (result.length === this.task.details.droneActions.length) {
              const matchFunction = function (entryOne: DroneAction, entryTwo: DroneAction) {
                return entryOne.x === entryTwo.x && entryOne.y === entryTwo.y && entryOne.z === entryTwo.z && entryOne.direction === entryTwo.direction && entryOne.action === entryTwo.action;
              };
              solvedCorrectly = this.checkArrayResultWithMatchFunction(result, this.task.details.droneActions, matchFunction);
            }

            if (solvedCorrectly) {
              result = this.getUserSolution().movement;
              let kompassnadel = "north";
              //Anfangskoordinaten
              let x = 0;
              let y = 0;
              let z = 1;
              let flight = [[x, y, z]];


              const matchFunction = function (entryOne: DroneAction, entryTwo: number) {
                return entryOne.x === entryTwo[0] && entryOne.y === entryTwo[1] && entryOne.z === entryTwo[2];
              };


              result.forEach((droneAction) => {
                //Dronenflugbahn
                switch (droneAction.direction) {

                  case 'right':

                    switch (kompassnadel) {

                      case 'north':
                        if (droneAction.angle){
                          kompassnadel="east";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('x: ', droneAction.distance);

                        for (let i = 0; i < droneAction.distance; i++) {
                          x++;
                          flight.push([x, y, z]);
                        }


                        break;
                      case 'west':
                        if (droneAction.angle){
                          kompassnadel="north";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y++;
                          flight.push([x, y, z]);
                        }
                        break;
                      case 'east':
                        if (droneAction.angle){
                          kompassnadel="south";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('-y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y--;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'south':
                        if (droneAction.angle){
                          kompassnadel="west";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('-x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x--;
                          flight.push([x, y, z]);
                        }
                        break;
                    }

                    break;

                  case 'left':


                    switch (kompassnadel) {
                      case 'north':
                        if (droneAction.angle){
                          kompassnadel="west";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('-x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x--;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'west':
                        if (droneAction.angle){
                          kompassnadel="south";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('-y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y--;
                          flight.push([x, y, z]);
                        }
                        break;
                      case 'east':
                        if (droneAction.angle){
                          kompassnadel="north";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y++;
                          flight.push([x, y, z]);
                        }
                        break;
                      case 'south':
                        if (droneAction.angle){
                          kompassnadel="east";
                          break;
                        }
                        console.log("Im Switch", kompassnadel);
                        console.log('x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x++;
                          flight.push([x, y, z]);
                        }
                        break;

                    }
                    break;

                  case 'forwards':

                    //console.log('y: ', droneAction.distance);
                    switch (kompassnadel) {
                      case 'north':
                        console.log("Im Switch", kompassnadel);
                        console.log('y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y++;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'west':
                        console.log("Im Switch", kompassnadel);
                        console.log('-x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x--;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'east':
                        console.log("Im Switch", kompassnadel);
                        console.log('x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x++;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'south':
                        console.log("Im Switch", kompassnadel);
                        console.log('-y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y--;
                          flight.push([x, y, z]);
                        }
                    }
                    break;

                  case 'backwards':


                    switch (kompassnadel) {
                      case 'north':
                        console.log("Im Switch", kompassnadel);
                        console.log('-y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y--;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'west':
                        console.log("Im Switch", kompassnadel);
                        console.log('x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x++;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'east':
                        console.log("Im Switch", kompassnadel);
                        console.log('-x: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          x--;
                          flight.push([x, y, z]);
                        }
                        break;

                      case 'south':
                        console.log("Im Switch", kompassnadel);
                        console.log('y: ', droneAction.distance);
                        for (let i = 0; i < droneAction.distance; i++) {
                          y++;
                          flight.push([x, y, z]);
                        }
                        break;
                    }
                    break;

                  case 'upwards':

                    console.log('z: ', droneAction.distance);
                    for (let i = 0; i < droneAction.distance; i++) {
                      z++;
                      flight.push([x, y, z]);
                    }
                    break;

                  case 'downwards':

                    console.log('-z: ', droneAction.distance);
                    for (let i = 0; i < droneAction.distance; i++) {
                      z--;
                      flight.push([x, y, z]);
                    }
                    break;
                }


                const crash = this.checkDroneMovementForCollisionWithMatchFunction(this.task.details.cubeCoords, flight, matchFunction);
                console.log("Crash ?", crash, flight, this.task.details.cubeCoords);
                solvedCorrectly = !crash;

              });
            }
            //@ts-ignore
            console.log('Code eval result', result);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    if (solvedCorrectly) {
      this.task.solution = solution;
      this.task.solved = true;
    }
    await this.storage.updateTask(this.task);
    if (solvedCorrectly) {
      await this.openSuccessAlert();
    } else {
      await this.openFailureAlert();
    }


    // }
    //TODO Open Popup and add Saved Solution state
  }

  checkDroneMovementForCollisionWithMatchFunction(blocks, movements, matchFunction) {

    return blocks.some(entry => {
      //Check if Action is at an expected Position and not Duplicate
      console.log('checkingNew', entry, movements);
      return movements.findIndex(resEntry => matchFunction(entry, resEntry)) >= 0;
    })
  }


  checkArrayResultWithMatchFunction(userArray, expectedArray, matchFunction) {
    let checkedEntries = [];
    return userArray.every(entry => {
      // Track checked Actions to reveal possible Duplicates for Obvious reasons Duplicate Actions are wrong!
      let checkedEntry = checkedEntries.find(checkedEntry => {
        return matchFunction(checkedEntry.entry, entry)
      });
      if (!checkedEntry) {
        checkedEntry = {entry, count: 1};
        checkedEntries.push(checkedEntry);
      } else {
        checkedEntry.count++
      }
      //Check if Action is at an expected Position and not Duplicate
      return expectedArray.findIndex(resEntry => matchFunction(entry, resEntry)) >= 0 && checkedEntry.count === 1;
    })
  }

  async openSuccessAlert() {
    const thiss = this;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('a.task.popover.success.title'),
      message: this.translate.instant('a.task.popover.success.title'),
      buttons: [
        {
          text: this.translate.instant('a.button.close')
        },
        {
          text: this.translate.instant('a.button.backToList'),
          handler: () => {
            thiss.goBack();
          }
        }
      ]
    });
    alert.present();
  }

  async openFailureAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('a.task.popover.failure.title'),
      message: this.translate.instant('a.task.popover.failure.title'),
      buttons: [
        {
          text: this.translate.instant('a.button.close')
        }
      ]
    });
    alert.present();
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
    setTimeout(() => {
      this.redrawBlocklyArea();
    }, 10);
  }

  openImage() {
    if (this.task.imageURL && this.task.imageURL !== '' && this.task.imageURL !== 'undefined') {
      console.log('opening', this.task.imageURL);
      this.photoViewer.show(this.task.imageURL);
    }
  }

  async openHint(hint: Hint, index: number) {
    if (index === 0 || this.task.hints[index - 1].opened) {
      const alert = await this.alertCtrl.create({
        message: hint.text,
        buttons: [
          {
            text: this.translate.instant('a.button.close')
          }
        ]
      });
      await alert.present();
      hint.opened = true;
    }
    this.storage.updateTask(this.task);
  }

  undoAction() {
    this.blocklyWorkspace.undo(false);
  }

  redoAction() {
    this.blocklyWorkspace.undo(true);
  }

  canSkip() {
    let result = true;
    for (const hint of this.task.hints) {
      if (!hint.opened) {
        result = false;
      }
    }
    if (this.task.skipped || this.task.solved) {
      result = false;
    }
    return result;
  }

  skipTask() {
    this.task.skipped = true;
    this.goBack();
  }

  isArTask() {
    return this.task.isAr;
  }

  async openInAR() {
    //TODO: Replace this with some kind of setting probably later;
    const showExpected = true;
    if (this.task.type === TaskFamilies.cubes) {
      console.log("Set Params", [this.task.details.cubeCoords, this.getUserSolution(), showExpected]);
      this.navParams.setParamsForPage('ar-preview', {
        params: [this.task.details.cubeCoords, this.getUserSolution(), showExpected],
        type: 'cubes'
      });
      const modal = await this.modalCtrl.create({
        component: ArPreviewPage,
      });
      await modal.present();
    }
    if (this.task.type === TaskFamilies.drone) {
      console.log("Set Params", [this.task.details.cubeCoords, this.getUserSolution()]);
      this.navParams.setParamsForPage('ar-preview', {
        params: [this.task.details.cubeCoords, this.getUserSolution().movement],
        type: 'drone'
      });
      const modal = await this.modalCtrl.create({
        component: ArPreviewPage,
      });
      await modal.present();
    }
  }

}
