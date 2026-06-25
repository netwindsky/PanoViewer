/**
 * PanoEngine适配器
 * 扩展PanoViewV2标准库的PanoEngine，添加loadSceneConfig方法
 * 用于从后端JSON配置加载全景场景，而非XML文件
 */
import { PanoEngine } from '@panoview/core/PanoEngine'
import { SegmentedBox } from '@panoview/geometry/SegmentedBox'
import { PanoSplitter } from '@panoview/texture/PanoSplitter'
import { TileManager } from '@panoview/core/TileManager'
import type { TileConfig } from '@panoview/core/TileTypes'
import type { SceneData } from '@panoview/core/SceneParser'
import { Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three'

export class PanoEngineAdapter extends PanoEngine {
  private adapterTileManager: TileManager | null = null
  private adapterSegmentedBoxes: SegmentedBox[] = []

  /**
   * 从后端JSON配置加载全景场景
   * @param config 后端生成的场景配置（JSON对象或SceneData数组）
   */
  public loadSceneConfig(config: SceneData | SceneData[] | Record<string, any>): void {
    let sceneData: SceneData

    if (Array.isArray(config)) {
      sceneData = config[0]
    } else if (config.scene && config.image) {
      sceneData = config as SceneData
    } else {
      sceneData = this.convertToSceneData(config)
    }

    this.loadSceneInternal(sceneData)
  }

  private convertToSceneData(config: Record<string, any>): SceneData {
    return {
      scene: {
        name: config.scene?.name || 'default',
        title: config.scene?.title || '',
        onstart: '',
        thumburl: '',
        lat: '',
        lng: '',
        heading: '',
      },
      view: {
        hlookat: String(config.view?.hlookat ?? '0'),
        vlookat: String(config.view?.vlookat ?? '0'),
        fovtype: config.view?.fovtype || 'MFOV',
        fov: String(config.view?.fov ?? '90'),
        maxpixelzoom: '2.0',
        fovmin: String(config.view?.fovmin ?? '30'),
        fovmax: String(config.view?.fovmax ?? '120'),
        limitview: 'auto',
      },
      preview: config.preview
        ? { url: config.preview.url }
        : undefined,
      image: {
        type: config.image?.type || 'CUBE',
        multires: config.image?.multires ?? true,
        tilesize: String(config.image?.tilesize ?? '512'),
        levels: (config.image?.levels || []).map((level: any) => ({
          tiledimagewidth: String(level.tiledimagewidth),
          tiledimageheight: String(level.tiledimageheight),
          cube: { url: level.cube?.url || '' },
        })),
      },
      hotspots: config.hotspots || [],
    }
  }

  private async loadSceneInternal(sceneData: SceneData): Promise<void> {
    if (!sceneData?.image?.levels || sceneData.image.levels.length === 0) {
      console.warn('场景数据中缺少levels信息')
      return
    }

    this.cleanupScene()

    if (sceneData.view) {
      this.initCameraView(sceneData.view)
    }

    if (sceneData.preview?.url) {
      await this.initPreview(sceneData.preview.url)
    }

    const levels = [...sceneData.image.levels].sort(
      (a, b) => (parseInt(String(a.tiledimagewidth)) || 0) - (parseInt(String(b.tiledimagewidth)) || 0),
    )

    const scene = (this as any).scene as Scene
    this.adapterTileManager = new TileManager(scene, {
      workerManager: (this as any).workerManager,
    })

    const levelResolutions = levels.map((level: any) => parseInt(String(level.tiledimagewidth)))
    this.adapterTileManager.setLevelResolutions(levelResolutions)

    levels.forEach((level: any, index: number) => {
      const levelWidth = parseInt(String(level.tiledimagewidth))
      const levelHeight = parseInt(String(level.tiledimageheight))
      if (!levelWidth || !levelHeight || !level.cube?.url) {
        console.warn(`第${index}级level数据不完整，已跳过`)
        return
      }

      const segmentedBox = new SegmentedBox()
      segmentedBox.setLevels(index)
      this.adapterSegmentedBoxes.push(segmentedBox)

      const tileConfig: TileConfig = {
        tiledimagewidth: levelWidth,
        tiledimageheight: levelHeight,
        urlTemplate: level.cube.url,
      }

      const boxGroup = segmentedBox.create(levelWidth, levelWidth, levelWidth)

      const levelMeshes: Mesh[] = []
      boxGroup.traverse((object) => {
        if (object instanceof Mesh) {
          object.material.depthTest = false
          object.material.depthWrite = false
          object.material.wireframe = false
          object.material.opacity = 0.0
          object.material.transparent = true
          object.material.polygonOffset = true
          object.material.polygonOffsetFactor = -index * 1.0
          object.material.polygonOffsetUnits = -index * 1.0
          object.renderOrder = -1
          object.userData.level = index
          object.updateMatrixWorld(true)
          levelMeshes.push(object)
        }
      })

      this.adapterTileManager!.addMeshes(levelMeshes)
      scene.add(boxGroup)
    })

    if (sceneData.view?.fovmin && sceneData.view?.fovmax) {
      this.adapterTileManager.setFOVRange(
        parseInt(sceneData.view.fovmin),
        parseInt(sceneData.view.fovmax),
      )
    }
  }

  private async initPreview(previewUrl: string): Promise<void> {
    const scene = (this as any).scene as Scene
    const segmentedBox = new SegmentedBox()
    segmentedBox.setLevels(999)
    const boxGroup = segmentedBox.create(512, 512, 512)
    this.adapterSegmentedBoxes.push(segmentedBox)
    boxGroup.scale.set(2, 2, 2)
    scene.add(boxGroup)

    const splitter = new PanoSplitter()
    const textures = await splitter.splitPanorama(previewUrl)
    const meshes = this.getMeshesByLevel(999)

    Object.entries(textures).forEach(([faceName, texture]) => {
      const mesh = meshes.find((m) => m.userData.name.includes(faceName))
      if (mesh) {
        texture.colorSpace = 'srgb'
        mesh.material.map = texture
        mesh.material.opacity = 1
        mesh.material.transparent = false
        mesh.material.needsUpdate = true
      }
    })
  }

  private initCameraView(view: any): void {
    const camera = (this as any).camera as PerspectiveCamera
    if (view.hlookat) {
      const hlookat = parseFloat(String(view.hlookat))
      const vlookat = parseFloat(String(view.vlookat))
      const fov = parseFloat(String(view.fov))

      const yaw = (hlookat * Math.PI) / 180
      const pitch = (vlookat * Math.PI) / 180
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
      if (fov) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    }
  }

  private cleanupScene(): void {
    const scene = (this as any).scene as Scene

    if (this.adapterTileManager) {
      this.adapterTileManager.dispose()
      this.adapterTileManager = null
    }

    this.adapterSegmentedBoxes = []

    const toRemove: any[] = []
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        toRemove.push(object)
      }
    })
    toRemove.forEach((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((mat: MeshBasicMaterial) => {
          if (mat.map) mat.map.dispose()
          mat.dispose()
        })
      }
      scene.remove(obj)
    })
  }

  public override dispose(): void {
    this.cleanupScene()
    super.dispose()
  }
}
