const HashMap = require("hashmap");

class User {
    constructor(userid, roomid) {
        this.userid = userid;
        this.ice = "";
        this.sdp = "";
        this.roomid = roomid;
    }
};

class Room {
    constructor(roomid) {
        this.roomid = roomid;
        this.users = new HashMap();
    }

    addUser(userid) {
	var user = new User(userid, this.roomid);
        this.users.set(userid, user);
        
	return user;
    }

    getUser(userid){
       return this.users.get(userid);
    }

    removeUser(userid){
	this.users.delete(userid);
    }
};

const static = require('node-static');
const http = require('http');
const file = new(static.Server)();
const app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(2013);

const io = require('socket.io').listen(app); //侦听 2013
var roomList = new HashMap();

io.sockets.on('connection', (socket) => {
  //console.log("connect:", socket/*, io.sockets.adapter.rooms[]*/);
  var thisroomid = "";

  socket.on('disconnect', ()=>{
    var room = roomList.get(thisroomid);
    if(!!room) {
        socket.leave(thisroomid);
        room.removeUser(socket.userInfo.userid);
    }
    console.log("disconnect:", socket.userInfo);
  });

  socket.on('offerSdp', (data) => { //广播
    console.log("offerSdp");
    var obj = JSON.parse(data);
    socket.broadcast.to(obj.roomid).emit('offerSdp', data);
    //socket.broadcast.emit('message', message); //在真实的应用中，应该只在房间内广播
  });

  socket.on('answerSdp', (data) => { //广播
    console.log("answerSdp");
    var obj = JSON.parse(data);
    socket.broadcast.to(obj.roomid).emit('answerSdp', data);
    //socket.broadcast.emit('message', message); //在真实的应用中，应该只在房间内广播
  });

  socket.on('icecandidate', (data) => { //广播
    console.log("======icecandidate");
    var obj = JSON.parse(data);
    socket.broadcast.to(obj.roomid).emit('icecandidate', data);
    //socket.broadcast.emit('message', message); //在真实的应用中，应该只在房间内广播
  });

  socket.on('ice', (data) => { //收到message时，进行广播
    log('Got message:', data);
    // for a real app, would be room only (not broadcast)
    socket.broadcast.to(obj.roomid).emit('ice', data);
    //socket.broadcast.emit('message', message); //在真实的应用中，应该只在房间内广播
  });

  socket.on('create or join', (data) => { //收到 “create or join” 消息
    var obj = JSON.parse(data);
    thisroomid = obj.roomid;
    console.log(obj.roomid);
    var room = null;
    if (roomList.has(obj.roomid)) {
        room = roomList.get(obj.roomid);
    } else {
        room = new Room(obj.roomid);   
    }
    var user = room.addUser(obj.userid);
    roomList.set(obj.roomid, room);
    socket.userInfo = user;

    socket.join(obj.roomid);

    console.log(JSON.stringify(room));
    socket.emit('joined', JSON.stringify(room));
    socket.broadcast.to(obj.roomid).emit('joined', JSON.stringify(room));
    //socket.emit('joined', room); //发送 "full" 消息
    /*if (numClients === 0){ //如果房间里没人
      socket.join(room);
      socket.emit('created', room); //发送 "created" 消息
    } else if (numClients === 1) { //如果房间里有一个人
	  io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room); //发送 “joined”消息
    } else { // max two clients
      socket.emit('full', room); //发送 "full" 消息
    }
    socket.emit('emit(): client ' + socket.id +
      ' joined room ' + room);
    socket.broadcast.emit('broadcast(): client ' + socket.id +
      ' joined room ' + room);*/

  });

});

