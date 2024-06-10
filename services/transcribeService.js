var fs = require('fs');
const logFile = "./transcription.txt"

function appendTextToLog(timestamp,text,user) {
  //generate file if it doesnt exist
  fs.stat(logFile, function(err, stat) {
    if (err == null) {
      console.log('File exists');
    } else if (err.code === 'ENOENT') {
      // file does not exist
      fs.writeFile(logFile, '');
    } 
  });

  var data = `[${timestamp}] ${user}: ${text}\n`

  fs.appendFile(logFile, data, (err) => {
    if (err) {
        console.log(err);
    }
});

}

module.exports = { appendTextToLog};