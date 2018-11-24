/**
 *
 * @title AcAttachment
 * @description AcAttachment基本示例
 *
 */

import React, { Component } from 'react';
import AcAttachment from '../../src/index';

class Demo1 extends Component {
    constructor(props){
        super(props);
        this.state = {
            
        };
    }
    render () {
        // let {} = this.state;

        return (
            <div className="demoPadding demo1">
                <AcAttachment></AcAttachment>
            </div>
        )
    }
}

export default Demo1;
