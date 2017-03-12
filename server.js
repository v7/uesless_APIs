var express = require('express')
var useragent = require('useragent');
var Negotiator = require('negotiator')
var mongoose = require('mongoose')
var shortid = require('shortid');
var url = process.env.MONGOLAB_URI;
mongoose.connect(url)
var linksSchema = new mongoose.Schema({
  link: {
         type:String,
         required: true,
     },
     _id: {
       type: String,
       'default': shortid.generate
   }
})
var Link = mongoose.model('Link',linksSchema)
useragent(true);
var app = express()

app.use(express.static('public'))



app.get('/',function(req,res){

    res.sendFile('./index.html')

})

app.get('/new/:link(*)',function(req,res){

  var regexp = new RegExp("^http(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?$");
  var url = req.params.link
  var thehost = req.headers.host

  if(!regexp.test(url)){

    res.json({error:'URL invalid'})

  }else{
    console.log(url)

    Link.create({link:url},function(err,data){



      res.json({original_url:data.link,short_url:thehost+"/"+data._id})


    })





  }



})




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

app.get('/:link',function(req,res){

  var url = req.params.link

    Link.findById(url,function(err,data){

      if(!data){

        res.json({url:"not found"})

      }else{

        res.redirect(data.link)

      }

    })


})


app.listen(process.env.PORT || 3000 ,function(){

  console.log('server up')
})
