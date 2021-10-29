var assert = require('assert');
const LoadTester = require('./loading/index');


describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {
     const appTester = new LoadTester({
        slowMo: 0,
        host: 'http://localhost:3000',
      })

      appTester.PromiseIntercept = (value) =>{
        try{
          console.log('Promise Error Intercepted ',  JSON.parse(value,null, 4));
        }catch(e){
          console.log('Promise Error Intercepted ',  JSON.stringify(value));
        }finally{
          this.stats.errors.push(value);
        }
        assert(value, Error);
      }

      await appTester.run();
      done();
    });
  });
});