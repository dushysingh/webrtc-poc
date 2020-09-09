import React, { Component } from "react";
import RTCMultiConnection from "rtcmulticonnection";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import "./Publicroom.css";

var params = {};
var streamIds = [];
export class Publicroom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recordVideo: null,
      roomId: "",
      isMute: false,
      isMuteVideo: false,
      isFrontViewCamera: false,
      localStreamId: "",
      disableFlip: false,
      isLoaded: false,
    };
    this.connection = new RTCMultiConnection();
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.socketConnection();
  }

  socketConnection = () => {
    //this.connection.socketURL = "http://localhost:3002/";
     this.connection.socketURL = 'http://ed5b90e85267.ngrok.io/'
    // this.connection.socketURL="https://video-chat-dev-1325.herokuapp.com/";
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
    const remoteVideo = document.getElementById("remote-video");
    const remoteVideo1 = document.getElementById("remote-video1");
    const remoteVideo2 = document.getElementById("remote-video2");
    const remoteVideo3 = document.getElementById("remote-video3");
    const remoteVideo4 = document.getElementById("remote-video4");

    this.connection.videoContainer = document.getElementById(
      "videos-container"
    );
    // new stream
    this.connection.onstream = (event) => {
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
          if (!remoteVideo.srcObject) {
            remoteVideo.id = event.streamid;
            return (remoteVideo.srcObject = event.stream);
          }
          if (!remoteVideo1.srcObject) {
            remoteVideo1.id = event.streamid;
            return (remoteVideo1.srcObject = event.stream);
          }
          if (!remoteVideo2.srcObject) {
            remoteVideo2.id = event.streamid;
            return (remoteVideo2.srcObject = event.stream);
          }
          if (!remoteVideo3.srcObject) {
            remoteVideo3.id = event.streamid;
            return (remoteVideo3.srcObject = event.stream);
          }
          if (!remoteVideo4.srcObject) {
            remoteVideo4.id = event.streamid;
            return (remoteVideo4.srcObject = event.stream);
          }
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
    // // stream error
    // this.connection.onMediaError = (e) => {
    //   if (e.message === "concurrent mic process limit.") {
    //     if (DetectRTC.audioInputDevices.length <= 1) {
    //       alert("Please select external microphone");
    //       return;
    //     }

    //     let secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
    //     this.connection.mediaConstraints.audio = {
    //       deviceId: secondaryMic,
    //     };
    //     this.connection.join(this.connection.sessionId);
    //   }
    // };

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

  // create room
  createRoom = (event) => {
    event.preventDefault();
    this.disabledButtons();
    let roomids = this.state.roomId;
    this.connection.getUserMedia((mediastreeam) => {
      console.log("mediastreeam", mediastreeam);
    });
    this.connection.open(roomids, (isRoomOpened, roomid, error) => {
      if (isRoomOpened === true) {
        // alert('ROOM CREATED :' + roomid)
        this.disabledButtons(true);
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
        this.disabledButtons(true);
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
  endCall = (e, endForAllMembers) => {
    if (endForAllMembers) {
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
        <Button
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
          onClick={(e) => this.unmute(e, true)}
        >
          <i className="material-icons">volume_up</i>
        </Button>
      </div>
    ) : (
      <div>
        <Button
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
          onClick={(e) => this.mute(e, true)}
        >
          <i className="material-icons">volume_off</i>
        </Button>
      </div>
    );
  };
  // toggle mute & unmute video buttons actions
  muteVideoActions = () => {
    return this.state.isMuteVideo ? (
      <Button
        variant="contained"
        style={{ backgroundColor: "#5bc0de" }}
        onClick={(e) => this.unmute(e, false)}
      >
        <i className="material-icons">videocam</i>
      </Button>
    ) : (
      <Button
        variant="contained"
        style={{ backgroundColor: "#5bc0de" }}
        onClick={(e) => this.mute(e, false)}
      >
        <i className="material-icons">videocam_off</i>
      </Button>
    );
  };

  capture = (defaultsOpts, shouldFaceUser) => {
    defaultsOpts.video = {
      facingMode: shouldFaceUser ? "user" : "environment",
    };
    this.connection.captureUserMedia((_stream) => {}, defaultsOpts);
  };

  // toggle switch functionality Front/rear
  switchCamera = (e, isFrontView) => {
    //let streamData = 
    this.connection.streamEvents.selectFirst({
      local: true,
    });

    let localVideo = document.getElementById(this.state.localStreamId);

    if (localVideo == null) return;

    if (localVideo.srcObject == null) return;
    this.connection.attachStreams.forEach((localStream) => {
      localStream.stop();
    });
    // this.connection.removeStream(this.state.localStreamId)
    localVideo.id = "local-video";
    this.capture(this.connection.mediaConstraints, isFrontView);
    this.setState({ isFrontViewCamera: !isFrontView });
  };

  // toggle camera action buttons
  cameraActions = () => {
    if (this.state.disableFlip) {
      return (
        <Button
          disabled
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
        >
          <i className="material-icons">camera_front</i>
        </Button>
      );
    } else {
      return !this.state.isFrontViewCamera ? (
        <Button
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
          onClick={(e) => this.switchCamera(e, false)}
        >
          <i className="material-icons">camera_rear</i>
        </Button>
      ) : (
        <Button
          variant="contained"
          style={{ backgroundColor: "#5bc0de" }}
          onClick={(e) => this.switchCamera(e, true)}
        >
          <i className="material-icons">camera_front</i>
        </Button>
      );
    }
  };

  buttonActions = () => {
    return this.state.isLoaded ? (
      <Grid container justify="center" spacing={1}>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            onClick={(e) => this.endCall(e, true)}
          >
            <i className="material-icons">call_end</i>
          </Button>
        </Grid>
        <Grid item></Grid>
        <Grid item>{this.cameraActions()}</Grid>
        <Grid item>{this.muteActions()}</Grid>
        <Grid item>{this.muteVideoActions()}</Grid>
        {/* <button className="btn btn-danger" onClick={e=> this.endCall(e,false)}> <i className="material-icons">clear_all</i></button> */}
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
          style={{ backgroundColor: "#FFFAFA", height: "90vh" }}
        >
          <div>
            <form className="form-room">
              <div className="container_dashboard">
                <div className="col-lg-12 container_dashboard">
                  <input
                    type="text"
                    name="roomId"
                    placeholder="Room ID"
                    id="roomId"
                    label="Name"
                    value={this.state.roomId}
                    onChange={(e) => this.handleChange(e)}
                  />
                </div>
                <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                  <Button
                    variant="contained"
                    color="primary"
                    id="create-room"
                    onClick={(e) => this.createRoom(e)}
                  >
                    Create Room
                  </Button>
                </div>

                <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                  <Button
                    variant="contained"
                    color="primary"
                    id="join-room"
                    onClick={(e) => this.joinedRoom(e)}
                  >
                    {" "}
                    Joined Room
                  </Button>
                </div>
              </div>
            </form>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <video
              autoPlay
              className="remote-video"
              id="remote-video"
              playsInline
            ></video>
            <video
              autoPlay
              className="remote-video"
              id="remote-video1"
              playsInline
            ></video>
            <video
              autoPlay
              className="remote-video"
              id="remote-video2"
              playsInline
            ></video>
            <video
              autoPlay
              className="remote-video"
              id="remote-video3"
              playsInline
            ></video>
            <video
              autoPlay
              className="remote-video"
              id="remote-video4"
              playsInline
            ></video>
          </div>
          <div className="my-video-container">
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
      </React.Fragment>
    );
  }
}

export default Publicroom;
