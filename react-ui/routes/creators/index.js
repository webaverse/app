import Creators from '../../components/Creators.js'
const styles = css`/routes/creators/index.css`

export default () => html`
  <div className=${styles}>
    <header className="App-header">
      <${Creators} />
    </header>
  </div>
`
