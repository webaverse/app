import childProcess from 'child_process'
import killPort from 'kill-port'

const isProduction = process.argv[2] === '-p';
const port = parseInt(process.env.PORT, 10) || (isProduction ? 443 : 3000);

const killports = () => {
    killPort(port)
}
killports()

const output = (child) => {
	child.stdout.setEncoding('utf8')
	child.stderr.setEncoding('utf8')
	child.stdout.on('data', function (data) {
		console.log(data)
	})
	child.stderr.on('data', function (data) {
		console.log(data)
	})
}

const runDev = childProcess.spawn('npm', ['run', 'server'],{ shell: process.platform === 'win32' })
runDev.on('exit', (exitCode) => {
  console.log(`dev exited with exit code`, exitCode)
})
output(runDev)

const runE2E = childProcess.spawn('npm', ['run', 'test-e2e'],{ shell: process.platform === 'win32' })
runE2E.on('exit', (exitCode) => {
  console.log(`e2e test exited with exit code`, exitCode)
})
output(runE2E)

process.on('exit', (exitCode) => {
	console.log(`'ese exited with exit code`, exitCode)
	killports()
	if (!runDev.killed) runDev.kill(exitCode)
	if (!runE2E.killed) runE2E.kill(exitCode)
})