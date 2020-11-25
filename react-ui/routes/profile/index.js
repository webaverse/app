import Profile from '../../components/Profile.js'
const styles = css`/routes/profile/index.css`

export default () => html`
  <div className=${styles}>
    <header className="App-header">
      <${Profile} />
    </header>
  </div>
`
