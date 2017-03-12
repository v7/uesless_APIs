var express = require('express')
var useragent = require('useragent');
var Negotiator = require('negotiator')
useragent(true);

var app = express()


app.get('/api/whoami',function(req,res){
    var negotiator = new Negotiator(req)
    var agent = useragent.parse(req.headers['user-agent']);
    var ipaddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var language = negotiator.languages()[0]
    var software =agent.toString();
    var obj= {ipaddress: ipaddress,
language: language,
software:software }


  res.json(obj)
})


app.listen(process.env.PORT || 3000 ,function(){

  console.log('server up')
})
