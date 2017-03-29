var express = require('express')
var app = express()
var useragent = require('useragent');
var bodyParser = require('body-parser')
var Negotiator = require('negotiator')
var mongoose = require('mongoose')
var shortid = require('shortid');
var url = process.env.MONGOLAB_URI;
console.log(url)
var request = require('request');
var SUBKEY = process.env.SUBKEY
var multer  = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage,limits: { fileSize: 1000000 }});

app.use(bodyParser.urlencoded({ extended: true }))
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

var termSchema = new mongoose.Schema({
    term:String,
    when: { type: Date, default: Date.now }
})

var Term = mongoose.model('Term',termSchema)

useragent(true);

app.set('view engine','ejs')
app.use(express.static('public'))



app.get('/',function(req,res){

//
    res.sendFile('./index.html')

})


app.get('/files',function(req,res){
    var size = req.query.size

    if(size){

      res.render('files',{size:size})

    }else{

      res.render('files',{size:null})
    }


})

app.post('/',upload.single('theFile'),function(req,res){


    res.redirect('/files?size='+req.file.size)

})


app.get('/api/imagesearch/:term',function(req,res){
  var term = encodeURI(req.params.term)
    var q = req.query.offset
  var url='https://api.cognitive.microsoft.com/bing/v5.0/images/search?q='+term+'&count=10'
  if(q !=null){
    url+='&offset='+q
  }
  var options = {
    url:url,
    headers: {
      'Ocp-Apim-Subscription-Key': SUBKEY
    }
  };

  function callback(error, response, body) {

  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    var arr = []
    info.value.forEach(function(info){

        var obj = {url:info.contentUrl,snippet:info.name,thumbnail:info.thumbnailUrl,context:info.hostPageUrl}
          arr.push(obj)
    })

    Term.create({term:req.params.term},function(err,data){

        res.send(arr)
    })




  }
}

  request(options,callback)

})


app.get('/api/latest/imagesearch/',function(req,res){

    Term.find().sort({_id:-1}).limit(10).exec(function(err,data){

      var latest=data.map(function(data){

            return {term:data.term,when:data.when}

        })

        res.send(latest)

    })


})

app.get('/new/:link(*)',function(req,res){

  var regexp = new RegExp("^http(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?$");
  var url = req.params.link
  var thehost = req.headers.host

  if(!regexp.test(url)){

    res.json({error:'URL invalid'})

  }else{


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
