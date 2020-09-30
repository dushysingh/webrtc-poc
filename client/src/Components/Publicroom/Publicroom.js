import React, { Component } from "react";
import RTCMultiConnection from "rtcmulticonnection";
import RecordRTC from "recordrtc";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Tooltip from '@material-ui/core/Tooltip';
import "./Publicroom.css";
import { DOMAIN_BASE_URL, SERVER_BASE_URL } from "../../env";
import Axios from 'axios';

var params = {};
var streamIds = [];
var dateBlob = new Date();
export class Publicroom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recordVideo: null,
      roomId: "",
      isMute: false,
      isMuteVideo: false,
      localStreamId: "",
      disableFlip: false,
      isLoaded: false,
      isRecording: false,
      isRoomCreatedOrJoined: false,
    };
    this.connection = new RTCMultiConnection();
    this.handleChange = this.handleChange.bind(this);
    this.recorder = '';
    this.serverRecorder = '';
  }

  componentDidMount() {
    this.socketConnection();
  }

  socketConnection = () => {
    this.connection.socketURL = 'https://dc38fb34013b.ngrok.io/'
    this.connection.publicRoomIdentifier = params.publicRoomIdentifier;
    this.connection.socketMessageEvent = "video-demo";

    this.connection.session = {
      audio: true,
      video: true,
      data: true,
    };

    this.connection.mediaConstraints = {
      video: true,
      audio: true,
    };

    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
    };
    var remoteVideosContainer = document.getElementById("remote-videos-container");

    this.connection.videoContainer = document.getElementById(
      "videos-container"
    );
    // new stream
    this.connection.onstream = (event) => {
      console.log("event== ",event);
      var remoteVideoElement = event.mediaElement; 
      remoteVideoElement.className = "remote-video";
      
      if (event.userid) {
        if (streamIds.includes(event.streamid)) {
          return;
        }
        streamIds.push(event.streamid);

        if (event.type === "local") {
          const localVideo = document.getElementById("local-video");
          if (localVideo) {
            localVideo.id = event.streamid;
            localVideo.srcObject = event.stream;

            this.localStreamId = event.streamid;

            this.setState({
              localStreamId: event.streamid,
              isLoaded: true,
            });
            this.connection.getAllParticipants().forEach((userid) => {
              //to send latest stream/track to end users
              this.connection.renegotiate(userid);
            });
          }
        } else {
          remoteVideosContainer.appendChild(remoteVideoElement);
        }
      }

      if (event.type === "local") {
        this.connection.socket.on("disthis.connection", () => {
          if (!this.connection.getAllParticipants().length) {
            window.location.reload();
          }
        });
      }
    };

    // end stream
    this.connection.onstreamended = (event) => {
      const remoteVideo = document.getElementById(event.streamid);
      if (remoteVideo) {
        remoteVideo.parentNode.removeChild(remoteVideo);
      }
    };

    this.connection.onleave = (event) => {
      this.connection.deletePeer(event.streamid);
    };

    // detect camera
    this.connection.DetectRTC.load(() => {
      const devices = this.connection.DetectRTC.videoInputDevices;
      if (!devices.length) {
        this.connection.mediaConstraints = {
          video: false,
          audio: true,
        };
        this.connection.session = {
          audio: true,
          video: false,
          data: true,
        };
        this.connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: false,
        };
      } else {
        if (devices.length > 1) {
          this.setState({ disableFlip: false });
        }
      }
    });

    // changes in SDP
    this.connection.processSdp = (sdp) => {
      if (this.connection.DetectRTC.browser.name === "Safari") {
        return sdp;
      }

      if (this.connection.codecs.video.toUpperCase() === "VP8") {
        sdp = this.connection.CodecsHandler.preferCodec(sdp, "vp8");
      }

      if (this.connection.codecs.video.toUpperCase() === "VP9") {
        sdp = this.connection.CodecsHandler.preferCodec(sdp, "vp9");
      }

      if (this.connection.codecs.video.toUpperCase() === "H264") {
        sdp = this.connection.CodecsHandler.preferCodec(sdp, "h264");
      }

      if (this.connection.codecs.audio === "G722") {
        sdp = this.connection.CodecsHandler.removeNonG722(sdp);
      }

      if (this.connection.DetectRTC.browser.name === "Firefox") {
        return sdp;
      }

      if (this.connection.bandwidth.video || this.connection.bandwidth.screen) {
        sdp = this.connection.CodecsHandler.setApplicationSpecificBandwidth(
          sdp,
          this.connection.bandwidth,
          !!this.connection.session.screen
        );
      }

      if (this.connection.bandwidth.video) {
        sdp = this.connection.CodecsHandler.setVideoBitrates(sdp, {
          min: this.connection.bandwidth.video * 8 * 1024,
          max: this.connection.bandwidth.video * 8 * 1024,
        });
      }

      if (this.connection.bandwidth.audio) {
        sdp = this.connection.CodecsHandler.setOpusAttributes(sdp, {
          maxaveragebitrate: this.connection.bandwidth.audio * 8 * 1024,
          maxplaybackrate: this.connection.bandwidth.audio * 8 * 1024,
          stereo: 1,
          maxptime: 3,
        });
      }

      return sdp;
    };

    // create room id logic
    let myRoomId = "";
    myRoomId = this.connection.token();

    this.setState({
      roomId: myRoomId,
    });
  };

  disabledButtons = (enable) => {
    document.getElementById("create-room").disabled = !enable;
    document.getElementById("join-room").disabled = !enable;
    document.getElementById("roomId").disabled = !enable;
  };

  //start recording
  startNewRecording = () => {
    this.setState({isRecording:true});
    
    // recordRTC lib call
    this.connection.getUserMedia( async (mediastreeam) => {
      //client recorder
      this.recorder = await new RecordRTC(mediastreeam, {
          type: 'video',
          mimeType: 'video/webm',
          disableLogs: false
      });
      await this.recorder.startRecording(mediastreeam, {
        type: 'video',
        mimeType: 'video/webm',
        disableLogs: false
      });
   
    });
  }

  //stop recording
  stopNewRecording = async() => {
    await this.recorder.stopRecording(async (blob)=>{
      
      let file = await this.recorder.getBlob();
      
      let fileName = this.state.roomId + "_"+ 
                      dateBlob.getDate() + "_" + 
                      (dateBlob.getMonth()+1)  + "_" +
                       dateBlob.getFullYear() + "_"  + 
                       dateBlob.getHours() + "_"  + 
                       dateBlob.getMinutes()+ "_"  + 
                       Math.floor(Math.random()*90000) + 10000; 

      var formData = new FormData();     
      formData.append('videoBlob', file, fileName+'.webm');
      let result = await Axios({
         method: 'post',
         url: `${SERVER_BASE_URL}/partial-blob`,
         data: formData,
         headers: {'Content-Type': 'multipart/form-data' }
        });

      this.recorder.save(blob); // download file in browser     
      this.setState({isRecording:false});
     // window.location.reload();
    });
  }


  // create room
  createRoom = (event) => {
    event.preventDefault();
    this.disabledButtons();
    let roomids = this.state.roomId;
    this.connection.getUserMedia( async (mediastreeam) => {
      console.log("mediastreeam", mediastreeam);
        //start recording
        this.startNewRecording();
          //server recorder
       this.serverRecorder = await new RecordRTC(mediastreeam, {
           type: 'video',
           mimeType: 'video/webm',
           disableLogs: false
        });
        await this.serverRecorder.startRecording(mediastreeam, {
           type: 'video',
           mimeType: 'video/webm',
           disableLogs: false
        });
    
    });

    this.connection.open(roomids, (isRoomOpened, roomid, error) => {
      if (isRoomOpened === true) {
         alert('ROOM CREATED :' + roomid)
        this.disabledButtons(true);
        this.setState({isRoomCreatedOrJoined:true});
        console.log("isRoomCreatedOrJoined:==== ",this.state.isRoomCreatedOrJoined);
        
      } else {
        console.error(error);
      }
    });
  };

  // joined room
  joinedRoom = (e) => {
    e.preventDefault();
    this.disabledButtons();
    this.connection.join(this.state.roomId, (isRoomJoined, roomid, error) => {
      if (isRoomJoined) {
        alert("ROOM JOINED :" + roomid);

        this.connection.getUserMedia( async (mediastreeam) => {
          console.log("mediastreeam", mediastreeam);
          this.startNewRecording();   
        });


        this.disabledButtons(true);
        this.setState({isRoomCreatedOrJoined:true});
        console.log("isRoomCreatedOrJoined:==== ",this.state.isRoomCreatedOrJoined);
        
      } else {
        if (error) {
          if (error === "Room not available") {
            alert(
              "this room does not exist. Please either create it or wait for moderator to enter in the room."
            );
            return;
          }
          alert(error);
        }
      }
    });
  };

  // end call for all members
  endCall = async (e, endForAllMembers) => {
    if (endForAllMembers) {
      //stop recording
      let recordedVideo;
      await this.serverRecorder.stopRecording(async(blob)=>{
        this.serverRecorder.save(blob);
        recordedVideo = {
          type: 'video/webm',
          data: blob,
          id: Math.floor(Math.random()*90000) + 10000
        }
        console.log("recordedVideo: ", recordedVideo);
        localStorage.setItem('recordedVideo',JSON.stringify(recordedVideo));
        
        let file = await this.serverRecorder.getBlob();
        let fileName = this.state.roomId + "_"+ 
                      dateBlob.getDate() + "_" + 
                      (dateBlob.getMonth()+1)  + "_" +
                       dateBlob.getFullYear() + "_"  + 
                       dateBlob.getHours() + "_"  + 
                       dateBlob.getMinutes()+ "_"  + 
                       Math.floor(Math.random()*90000) + 10000; 

        var formData = new FormData();
        formData.append('videoBlob', file, fileName+'.webm');
        let result = await Axios({
           method: 'post',
           url: `${SERVER_BASE_URL}/full-blob`,
           data: formData,
           headers: {'Content-Type': 'multipart/form-data' }
          });  

                // disconnect with all users
      this.connection.getAllParticipants().forEach((pid) => {
        this.connection.disconnectWith(pid);
      });

      // stop all local cameras
      this.connection.attachStreams.forEach((localStream) => {
        localStream.stop();
      });

       // close socket.io connection
       // this.connection.closeSocket();
       window.location.reload();

      });

    } else {
      // disthis.connection call
    }
  };

  // mute audio / video functionality
  mute = (e, isAudio) => {
    if (isAudio) {
      this.connection.attachStreams[0].mute("audio");
      this.connection.updateExtraData();
      this.setState({ isMute: true });
    } else {
      this.connection.attachStreams[0].mute("video");
      let streamData = this.connection.streamEvents.selectFirst({
        local: true,
      });
      let localVideo = document.getElementById(streamData.streamid);
      localVideo.setAttribute("src", "user.png");
      this.connection.updateExtraData();
      this.setState({ isMuteVideo: true });
    }
  };

  // unmute audio/ video funct
  unmute = (e, isAudio) => {
    if (isAudio) {
      this.connection.attachStreams[0].unmute();
      this.connection.updateExtraData();
      this.setState({ isMute: false });
    } else {
      this.connection.attachStreams[0].unmute();
      let streamData = this.connection.streamEvents.selectFirst({
        local: true,
      });
      let localVideo = document.getElementById(streamData.streamid);
      localVideo.removeAttribute("src");
      this.connection.updateExtraData();
      this.setState({ isMuteVideo: false });
    }
  };

  // toggle mute & unmute audio buttons actions
  muteActions = () => {
    return this.state.isMute ? (
      <div>
        <Tooltip title="Unmute" arrow>
          <Button
            variant="contained"
            style={{ backgroundColor: "#5bc0de" }}
            onClick={(e) => this.unmute(e, true)}
          >
            <i className="material-icons">volume_off</i>
          </Button>
        </Tooltip>
      </div>
    ) : (
      <div>
        <Tooltip title="Mute" arrow>
          <Button
            variant="contained"
            style={{ backgroundColor: "#5bc0de" }}
            onClick={(e) => this.mute(e, true)}
          >
            <i className="material-icons">volume_up</i>
          </Button>
        </Tooltip>
      </div>
    );
  };
  // toggle mute & unmute video buttons actions
  muteVideoActions = () => {
    return this.state.isMuteVideo ? (
      <Tooltip title="Show Video" arrow>
        <Button
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
          onClick={(e) => this.unmute(e, false)}
        >
          <i className="material-icons">videocam_off</i>
        </Button>
      </Tooltip>
    ) : (
      <Tooltip title="Hide Video" arrow>
        <Button
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
          onClick={(e) => this.mute(e, false)}
        >
          <i className="material-icons">videocam</i>
        </Button>
      </Tooltip>
    );
  };

  capture = (defaultsOpts, shouldFaceUser) => {
    defaultsOpts.video = {
      facingMode: shouldFaceUser ? "user" : "environment",
    };
    this.connection.captureUserMedia((_stream) => {}, defaultsOpts);
  };

  recordVideoActions = () => {
    return this.state.isRecording ? (
      <div>
        <Tooltip title="Stop Recording" arrow>
          <Button
            variant="contained"
            style={{ backgroundColor: "#5bc0de" }}
            onClick={() => this.stopNewRecording()}
          >
            <i className="material-icons">stop</i>
          </Button>
        </Tooltip>
      </div>
    ) : (
      <div>
        <Tooltip title="Start Recording" arrow>
          <Button
            variant="contained"
            style={{ backgroundColor: "#5bc0de" }}
            onClick={(e) => this.startNewRecording(e)}
          >
            <i className="material-icons">album</i>
          </Button>
        </Tooltip>
      </div>
    );
    
  }

  buttonActions = () => {
    return this.state.isLoaded ? (
      <Grid container justify="center" spacing={1}>
        <Grid item>
          <Tooltip title="End Call" arrow>
            <Button
              variant="contained"
              color="secondary"
              onClick={(e) => this.endCall(e, true)}
            >
              <i className="material-icons">call_end</i>
            </Button>
          </Tooltip>
        </Grid>
        <Grid item></Grid>
        <Grid item>{this.muteActions()}</Grid>
        <Grid item>{this.muteVideoActions()}</Grid>
        <Grid item>{this.recordVideoActions()}</Grid>
      </Grid>
    ) : (
      <div></div>
    );
  };

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  render() {
    return (
      <React.Fragment>
        <CssBaseline />
        <div
          display="flex"
          style={{ backgroundColor: "#FFFAFA", height: "85vh" }}
        >
          { (this.state.isRoomCreatedOrJoined === false) ?
            (
              <form className="form-room">
                <div className="container_center">
                  <div className="row">
                    <div className="col-sm-6 container_dashboard">
                      <input
                        type="text"
                        name="roomId"
                        placeholder="Room ID"
                        id="roomId"
                        label="Name"
                        value={this.state.roomId}
                        onChange={(e) => this.handleChange(e)}
                        className="form-control text-center"
                      />
                    </div>

                    <div className="col-sm-6 container_dashboard">
                      <Button
                        variant="contained"
                        color="primary"
                        id="create-room"
                        onClick={(e) => this.createRoom(e)}
                      >
                        Create Room
                      </Button>

                      <Button
                        variant="contained"
                        color="primary"
                        id="join-room"
                        onClick={(e) => this.joinedRoom(e)}
                      >
                        {" "}
                        Join Room
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ): 
            (
              <div className="text-center">
                <h3 className="text-success">Use this unique Room Id to join this room:</h3>
                <h4 className="text-info">Room Id: {this.state.roomId}</h4>
                <h4 className="text-success">
                  Open this <a className="text-info" href={DOMAIN_BASE_URL} target="_blank" >Join Room URL</a> url and use above room id to join meeting
                </h4>
                
              </div>
            )
          }
          <div className="container_flex_wrap">
            <div id="remote-videos-container">
            </div>
            
            <div>
              <video
                autoPlay
                playsInline
                muted
                className="local-video"
                id="local-video"
              ></video>
              {this.buttonActions()}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Publicroom;
