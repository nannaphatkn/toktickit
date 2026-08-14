import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

interface Category {
  id: string;
  name: string;
  description: string | null;
}

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5001/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch categories', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container mt-5">
      <header className="text-center mb-5">
        <div className="hero mb-4">
          <img src={heroImg} className="base" width="170" height="179" alt="Hero" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <h1>TokTickIT Service Desk</h1>
        <p className="lead">Submit and track your IT requests</p>
      </header>

      <section className="categories-section">
        <h2 className="mb-4 text-center">IT Request Categories</h2>
        
        {loading ? (
          <div className="text-center">
            <p>Loading categories...</p>
          </div>
        ) : (
          <div className="row g-4 justify-content-center">
            {categories.map((category) => (
              <div key={category.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body">
                    <h5 className="card-title text-primary">{category.name}</h5>
                    <p className="card-text text-muted">
                      {category.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default App

export default App
