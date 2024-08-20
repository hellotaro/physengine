import React, { useEffect, useState } from 'react';
import {useLocation} from "react-router-dom"
import './App.css';
import * as THREE from 'three'
import ScenarioManager from './manager/scenarioManager'

const INIT_GAMENAME: string = ""

function App() {
  let canvas: HTMLElement
  let size: { width: number, height: number }
  let renderer: THREE.WebGLRenderer
  let scenarioManager: ScenarioManager

  const gamenameList = [
    "###[test]", "test-3d",
    "###[physics]", "test-physics",
  ]

  const search = useLocation().search
  const query = new URLSearchParams(search)
  const [gamename, setGamename] = useState(INIT_GAMENAME)
  const [gameLoading, setGameLoading] = useState(INIT_GAMENAME != "")

  const gameloop = async (gamename: string) => {
    if (canvas) return;

    THREE.Cache.enabled = true

    canvas = document.getElementById("main-container")!

    size = { width: window.innerWidth, height: window.innerHeight }

    // renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas || undefined,
      antialias: true,
      alpha: true
    })
    renderer.shadowMap.enabled = true
    renderer.setSize(size.width, size.height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1)

    // scene
    const scene = new THREE.Scene()
    const sceneMeta = {
      canvas,
      size,
      renderer,
    }
    scenarioManager = ScenarioManager.getInstance(scene, sceneMeta)
    await scenarioManager.loadScenario("/scenario/" + gamename + "/story/main.json", sceneMeta)
    setGameLoading(false)

    // animation
    const clock = new THREE.Clock()
    const tick = () => {
      window.requestAnimationFrame(tick)
      const cameraObj = scenarioManager.getActiveCamera()
      scenarioManager.update(cameraObj.camera)
        .then(() => {
          const elapsedTime = clock.getElapsedTime()
          renderer.render(scene, cameraObj.camera)
        })
        .catch((e) => {
          console.log(e)
        })
      
      if(gameLoading) {
        setGameLoading(false)
      }
    }
    tick()

    initEvent()
  }

  const initEvent = () => {
    window.addEventListener('resize', () => {
      size.width = window.innerWidth
      size.height = window.innerHeight
      const cameraObj = scenarioManager.getActiveCamera()
      if (cameraObj.camera instanceof THREE.PerspectiveCamera) {
        cameraObj.camera.aspect = size.width / size.height
      }
      cameraObj._aspect = size.width / size.height
      cameraObj._size = [size.width, size.height]
      cameraObj.camera.updateProjectionMatrix()
      renderer.setSize(size.width, size.height)
      renderer.setPixelRatio(window.devicePixelRatio)
    })
  }

  useEffect(() => {
    if(gamename != "") {
      setGameLoading(true)
      setTimeout(() => {
        gameloop(gamename)
      }, 200)
    }
  }, [gamename])

  useEffect(() => {
    const paramGamename = query.get("gamename")
    if(paramGamename !== "" && paramGamename !== null) {
      setGamename(paramGamename)
    }
  }, [])
  
  // game starter
  useEffect(() => {
    setGamename(INIT_GAMENAME)
  }, [])

  return (
    <>
      {
        gamename == "" ? <div>
          <div className="flex flex-col divide-y divide-dashed">
            {
              gamenameList.map((gamename, idx) => {
                if(gamename.substring(0,3) == "###") {
                  return <div key={"gamename-" + idx} className="flex flex-row">
                    <div className="basis-1/4"></div>
                    <div className="basis-2/4 game-selectsection">{gamename.substring(3)}</div>
                    <div className="basis-1/4"></div>
                  </div>
                }
                return <div key={"gamename-" + idx} className="flex flex-row">
                  <div className="basis-1/4"></div>
                  <div className="basis-2/4 game-selectbutton"
                    onClick={(e) => { setGamename(gamename) }}>{gamename}</div>
                  <div className="basis-1/4"></div>
                </div>
              })
            }
          </div>

        </div> : null
      }
      {
        gamename != "" ? <div className={"scroll-container"}>
          <div className={"game-container"}>
            <canvas id="main-container" />
          </div>
        </div> : null
      }
    </>
  );
}

export default App;
