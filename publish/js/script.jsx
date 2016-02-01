var MD = {};
var socket = io();
var data = [];
socket.on("init", function(data){
  MD = React.render(<Hierarchy data={data}/>, document.body);
});


var Hierarchy = React.createClass({
  render: function () {
    this.props.root = this.props.data;
    this.props.data = this.props.data.users;

    return <div className="hierarchy">
      <Node data={this.props.data} root={this.props.root}/>
    </div>;
  }
});

var Node = React.createClass({
  render: function(){
    var person = this.props.data.uid !== false ? <Person data={this.props.data} node={this}/> : "";
    var department = this.props.data.department ? <Department data={this.props.data.department} node={this}/> : "";

    Object.defineProperties(this,{
      person: {
        enumerable: false,
        configurable: true,
        get: function(){
          return {
            name: this.props.data.name,
            uid: this.props.data.uid,
          }
        },
        set: function(person){
          Object.assign(this.props.data, person);
        }
      },
      up: {
        enumerable: true,
        configurable: true,
        value: function(lvl){
          if(!lvl){
            return this.props;
          }
          else{
            if(!this.props.node){
              return false;
            }

            return this.props.node.up(lvl-1);
          }
        }
      }
    });

    var classes = "node";
    classes+= this.props.data.department ? "" : " no-department";

    return <div className={classes}>
      {person}
      {department}
    </div>;
  }
});

var Person = React.createClass({
  componentDidMount: function(a, b, c){
    console.log(a);
    console.log(b);
    console.log(c);
    console.log(this);
  },
  promote: function(){
    var dePromoted = this.parent().node.person;

    this.parent().node.person = this.props.node.person;
    this.props.node.person = dePromoted;

    this.parent().node.forceUpdate();
    this.props.node.forceUpdate();

    socket.emit("saveTree",this.parent().root.users);
  },
  move: function(indx){
    var target = this.parent(2).data.department[indx];
    var position = this.props.data.position;
    var RULES = this.parent(1).root.RULES;
    var clearLength = Object.keys(target.department).length;
    var indx = this.parent().indx;

    if(clearLength>=RULES[position].max){
      return;
    }

    target.department.push(this.parent().data);
    var oldDepartment = this.parent(1).data.department;
    oldDepartment.splice(indx, 1);

    this.parent(1).node.forceUpdate();
    this.parent().node.forceUpdate();

    socket.emit("saveTree",this.parent().root.users);
  },
  render: function(){
    Object.defineProperties(this, {
      parent: {
        enumerable: true,
        configurable: true,
        value: function(lvl){
          if(!this.props.node){
            return false;
          }

          if(!lvl){
            return this.props.node.props;
          }
          else{
            return this.props.node.up(lvl);
          }
        }
      }
    });

    //console.log(React.findDOMNode(this));
    //console.log(this.refs);
    //console.log(ReactDOM.findDOMNode(this));
    var controls = this.parent(1) ? <Controls assignedTo={this}/> : false;
    var name = this.props.data.name.split(" ");

    return <div className="person">
      <div className="name">{name}</div>
      {controls}
    </div>;
  }
});

var Department = React.createClass({
  render: function(){
    var department = [];
    for(var i in this.props.data){
      department.push(<Node data={this.props.data[i]} indx={i} node={this.props.node} root={this.props.node.props.root}/>);
    }

    return <div className="department">{department}</div>;
  }
});

var Controls = React.createClass({
  getInitialState: function(){
    return {
      available: []
    }
  },
  update: function(){
    var _this = this;
    var available = [];
    if(!this.props.assignedTo.parent(2)){
      return;
    }
    var departments = this.props.assignedTo.parent(2).data.department;
    for(var i in departments){
      if(departments[i].name === this.props.assignedTo.parent(1).data.name){
        continue;
      }

      var position = this.props.assignedTo.props.data.position;
      var RULES = this.props.assignedTo.props.node.props.root.RULES;
      var clearLength = Object.keys(departments[i].department).length;

      if(clearLength >= RULES[position].max){
        continue;
      }

      var handler = function(indx){
        return function(){_this.props.assignedTo.move(indx)};
      }(i);

      available.push(<div onClick={handler} >{departments[i].name}</div>);
    }

    this.setState({available:available.length ? available : "all departments are full."});
  },
  render: function(){
    var promoteFunc = <div onClick={this.props.assignedTo.promote}>
      promote
    </div>;

    var moveFunc = this.props.assignedTo.parent(2) ?
      <div className="move">
        <spat>move</spat>
        <div className="available">
          {this.state.available}
        </div>
      </div> : false;

    return <div className="controls" onMouseEnter={this.update}>
      {promoteFunc}
      {moveFunc}
    </div>
  }
});