import Mint from '../../components/Mint.js'

const styles = css`/routes/mint/index.css`

export default () => html`
  <div className=${styles}>
    <header className="App-header">
      <${Mint} />
    </header>
  </div>
`
