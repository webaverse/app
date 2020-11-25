import Gallery from '../../components/Gallery.js'
const styles = css`/routes/gallery/index.css`

export default () => html`
  <div className=${styles}>
    <header className="App-header">
      <${Gallery} />
    </header>
  </div>
`
