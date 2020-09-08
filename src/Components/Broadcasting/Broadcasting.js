/* eslint-disable react/no-unused-state */
import React, { Component } from "react";
//import { useTracker } from "meteor/react-meteor-data";
import RTCMultiConnection from "rtcmulticonnection";
//import io from "socket.io-client";
import "/node_modules/webrtc-adapter/out/adapter.js";
import "./Broadcasting.css";

var params = {};
var roomHashURL = "";
var connection = {};

class Broadcasting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomId: "",
      isMute: false,
      isMuteVideo: false,
      isInitiator: false,
      isListener: false,
    };
    this.connection = new RTCMultiConnection();
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.socketConnection();
  }

  socketConnection = () => {
    this.connection.socketURL = "https://785e396d.ngrok.io/";
    // connection.socketURL="https://video-chat-dev-1325.herokuapp.com/";
    this.connection.socketMessageEvent = "video-broadcast-demo";

    this.connection.session = {
      audio: true,
      video: true,
      oneway: true,
    };

    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: false,
      OfferToReceiveVideo: false,
    };

    this.connection.iceServers = [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun.l.google.com:19302?transport=udp",
        ],
      },
    ];

    this.connection.videosContainer = document.getElementById(
      "videos-container"
    );
    this.connection.onstream = (event) => {
      if (event.type === "local") {
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
          localVideo.id = event.streamid;
          localVideo.srcObject = event.stream;
          this.setState({
            isInitiator: true,
          });
        }
      } else {
        const remoteVideo = document.getElementById("remote-video");
        if (remoteVideo) {
          remoteVideo.id = event.streamid;
          remoteVideo.srcObject = event.stream;
          this.setState({
            isInitiator: false,
            isListener: true,
          });
        }
      }
      if (event.type === "local") {
        this.connection.socket.on("disconnection", () => {
          if (!this.connection.getAllParticipants().length) {
            location.reload();
          }
        });
      }
    };

    this.connection.onstreamended = (event) => {
      var mediaElement = document.getElementById(event.streamid);
      if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);

        if (!this.connection.isInitiator) {
          alert(
            "Broadcast is ended. We will reload this page to clear the cache."
          );
          location.reload();
        }
        this.setState({
          isListener: false,
        });
      }
    };

    this.connection.onMediaError = (e) => {
      if (e.message === "Concurrent mic process limit.") {
        if (DetectRTC.audioInputDevices.length <= 1) {
          alert(
            "Please select external microphone. Check github issue number 483."
          );
          return;
        }

        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        this.connection.mediaConstraints.audio = {
          deviceId: secondaryMic,
        };

        this.connection.join(this.connection.sessionid);
      }
    };

    let myRoomId = "";
    myRoomId = this.connection.token();

    this.setState({
      roomId: myRoomId,
    });
  };

  // create room for broadcasting
  createRoom = (event) => {
    event.preventDefault();
    let roomids = this.state.roomId;
    this.connection.open(roomids, (roomid) => {
      alert("room created: " + roomids);
    });
  };

  // joined broadcasting room
  joinedRoom = () => {
    event.preventDefault();
    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: false,
      OfferToReceiveVideo: false,
    };
    this.connection.join(this.state.roomId);
  };

  // end Call members joined
  endCall = (e, endForAllMembers) => {
    if (endForAllMembers) {
      this.connection.attachStreams.forEach((localStream) => {
        localStream.stop();
      });
      this.connection.renegotiate();
    } else {
      let streamData = this.connection.streamEvents.selectFirst({
        remote: true,
      });
      this.connection.removeStream(streamData.streamid);
      this.connection.renegotiate();
    }
  };
  // mute audio or video
  mute = (e, isAudio) => {
    if (isAudio) {
      this.connection.attachStreams[0].mute("audio");
      this.connection.updateExtraData();
      this.connection.renegotiate();
      this.setState({ isMute: true });
    } else {
      this.connection.attachStreams[0].mute("video");
      this.connection.updateExtraData();
      this.connection.renegotiate();
      // this.setState({ isMuteVideo: true});
    }
  };
  // unmute audio or video
  unmute = (e, isAudio) => {
    if (isAudio) {
      this.connection.attachStreams[0].unmute();
      this.connection.updateExtraData();
      this.connection.renegotiate();
      // this.setState({ isMute: false});
    } else {
      this.connection.attachStreams[0].unmute();
      this.connection.updateExtraData();
      this.connection.renegotiate();
      this.setState({ isMuteVideo: false });
    }
  };

  // local stream actions
  actionsButtons = () => {
    return this.state.isInitiator ? (
      <div>
        <button
          className="btn btn-primary"
          onClick={(e) => this.endCall(e, true)}
        >
          {" "}
          <i className="material-icons">call_end</i>
        </button>
      </div>
    ) : (
      <div></div>
    );
  };

  actionsButtonsListener = () => {
    return this.state.isListener ? (
      <div>
        <button
          className="btn btn-primary"
          onClick={(e) => this.endCall(e, false)}
        >
          {" "}
          <i className="material-icons">call_end</i>
        </button>
      </div>
    ) : (
      <div> </div>
    );
  };

  muteActions = () => {
    return !this.state.isMute ? (
      <div>
        <button className="btn btn-primary" onClick={(e) => this.mute(e, true)}>
          <i className="material-icons">volume_off</i>
        </button>
      </div>
    ) : (
      <div>
        <button
          className="btn btn-primary"
          onClick={(e) => this.unmute(e, true)}
        >
          <i className="material-icons">volume_up</i>
        </button>
      </div>
    );
  };

  muteVideoActions = () => {
    return !this.state.isMuteVideo ? (
      <button className="btn btn-primary" onClick={(e) => this.mute(e, false)}>
        <i className="material-icons">videocam_off</i>
      </button>
    ) : (
      <button
        className="btn btn-primary"
        onClick={(e) => this.unmute(e, false)}
      >
        <i className="material-icons">videocam</i>
      </button>
    );
  };

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <div className="row">
        <form className="form-room">
          <div className="row container_dashboard">
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 container_dashboard">
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
              <button
                className="btn btn-primary"
                onClick={(e) => this.createRoom(e)}
              >
                {" "}
                Start Broadcasting
              </button>
            </div>

            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
              <button
                className="btn btn-primary"
                onClick={(e) => this.joinedRoom(e)}
              >
                {" "}
                Joined Room
              </button>
            </div>

            <div className="my-video-container">
              <video
                autoPlay
                muted
                className="local-video"
                id="local-video"
              ></video>
              <div className="action-button">
                {/* <button className="btn btn-primary" onClick={e=> this.endCall(e,false)}> <i className="material-icons">clear_all</i></button> */}
                {this.actionsButtons()}
              </div>
            </div>

            <div id="room-urls"></div>
          </div>

          <div className="row">
            <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12"></div>
            <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
              <video
                autoPlay
                className="remote-video1"
                id="remote-video"
              ></video>
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                {this.actionsButtonsListener()}
              </div>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12"></div>
          </div>
        </form>
      </div>
    );
  }
}
export default Broadcasting;
