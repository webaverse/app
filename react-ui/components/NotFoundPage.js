import css from '../web_modules/csz.js'

export default () => html`
  <div className="NotFoundPage">
    <header className="App-header">
      <p>There is not a route for the path <code>${location.pathname}</code></p>
      <a href='/' className='App-link'>Go Back Home</a>
    </header>
  </div>
`
