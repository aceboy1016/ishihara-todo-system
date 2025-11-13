import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Dashboard } from './components/layout/Dashboard'
import { useEffect } from 'react'
import './App.css'

const FluidBackground: React.FC = () => {
  useEffect(() => {
    let script = document.querySelector<HTMLScriptElement>('script[data-fluid-script="true"]')
    if (!script) {
      script = document.createElement('script')
      script.src = `${import.meta.env.BASE_URL}fluid-simulation.js?v=6`
      script.defer = true
      script.dataset.fluidScript = 'true'
      document.body.appendChild(script)
    }

    const existingCanvas = document.getElementById('fluid-canvas')
    if (!existingCanvas) {
      const canvas = document.createElement('canvas')
      canvas.id = 'fluid-canvas'
      canvas.setAttribute('role', 'presentation')
      canvas.style.position = 'fixed'
      canvas.style.inset = '0'
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
      canvas.style.zIndex = '-1'
      document.body.appendChild(canvas)
    }

    // Add particles overlay
    const existingParticles = document.querySelector('.particles-overlay')
    if (!existingParticles) {
      const particles = document.createElement('div')
      particles.className = 'particles-overlay'
      particles.setAttribute('role', 'presentation')
      document.body.appendChild(particles)
    }

    // Auto-generate splats periodically
    const autoSplatInterval = setInterval(() => {
      const fluidField = (window as any).FluidField
      if (fluidField && !fluidField.isPaused()) {
        fluidField.addRandomSplats(Math.floor(Math.random() * 2) + 1)
      }
    }, 8000)

    return () => {
      const inlineCanvas = document.getElementById('fluid-canvas')
      if (inlineCanvas && inlineCanvas.parentElement === document.body) {
        document.body.removeChild(inlineCanvas)
      }
      const particlesOverlay = document.querySelector('.particles-overlay')
      if (particlesOverlay && particlesOverlay.parentElement === document.body) {
        document.body.removeChild(particlesOverlay)
      }
      clearInterval(autoSplatInterval)
    }
  }, [])

  return null
}

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <FluidBackground />
      <Dashboard />
    </DndProvider>
  )
}

export default App
