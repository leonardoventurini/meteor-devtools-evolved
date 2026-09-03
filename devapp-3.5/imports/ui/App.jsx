import { Counter } from './Counter.jsx'
import { Header } from './Header.jsx'
import { Info } from './Info.jsx'
import { FixtureControls } from './FixtureControls.jsx'

export const App = () => (
  <div className='page'>
    <Header />
    <main className='main'>
      <Counter />
      <FixtureControls />
      <Info />
    </main>
  </div>
)
