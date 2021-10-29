var assert = require('assert');
const LoadTester = require('./loading/index');


describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', async (done) => {
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
      }

      await appTester.run();
      done();
    });
  });
});