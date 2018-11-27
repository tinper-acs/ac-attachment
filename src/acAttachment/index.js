import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {bindAll,isNumber} from './common';
import AcUpload from 'ac-upload';
import 'ac-upload/build/ac-upload.css';
import Table from 'bee-table';
import multiSelect from "bee-table/build/lib/multiSelect.js";
import sort from 'bee-table/build/lib/sort.js';
import Button from 'bee-button';
import Checkbox from 'bee-checkbox';
import Icon from 'bee-icon';
import axios from 'axios';
import './index.less';

let MultiSelectSortTable  = multiSelect(sort(Table, Icon), Checkbox);

const propTypes = {
	filepath: PropTypes.string,
    groupname: PropTypes.string,
    permission: PropTypes.oneOf(['read','private','full']),
	url: PropTypes.bool,
	uploadUrl: PropTypes.string,
	queryUrl: PropTypes.string,
	deleteUrl: PropTypes.string,
    downloadUrl: PropTypes.string,
    fileType: PropTypes.string,
    fileMaxSize: PropTypes.number
}

const defaultProps = {
	filepath: '56f1d786-127b-46d9-9ae3-43ca11486720',
    groupname: 'ygdemo',
    permission: 'read',
	url: true,
	uploadUrl: '/iuap-saas-filesystem-service/file/upload',
	queryUrl: '/iuap-saas-filesystem-service/file/query',
	deleteUrl: '/iuap-saas-filesystem-service/file/delete',
    downloadUrl: '/iuap-saas-filesystem-service/file/download',
    fileMaxSize: 10 * 1024 * 1024 //默认10M
}

class AcAttachment extends Component{
    constructor(props){
		super(props);
		this.state = {
            fileList: [],
            action: props.uploadUrl,
            selectedFiles: []
        }
        this.selectedFiles = [];
        this.fileTypeIcons = ['css','doc','html','javascript','jpg','pdf','png','ppt','xls','xml'];
        bindAll(this,['fGetTableColumns','fLoadFileList','fDeleteFile','fUploadSuccess','fUploadDelete',
                      'fDownload','fDelete','fGetSelectedData']);
	}
	componentDidMount(){
		this.fLoadFileList();
	}
	fLoadFileList(){
        const self = this;
		const {queryUrl,downloadUrl,filepath,groupname,permission} = self.props;

        return axios({
            url: queryUrl,
            params: {
                filepath: filepath,
                groupname: groupname,
                permission: permission
            }
        }).then(function(res){
            if(res.data){
                self.setState({
                    fileList: res.data.data
                })
            }
        }).catch(function (error) {
            console.log(error);
        });
    }
    fDeleteFile(id){
		const self = this;
		const {deleteUrl} = self.props;

        return axios({
            url: deleteUrl,
            params: {
                id: id
            }
        }).then(function(res){
            return res;
        }).catch(function (error) {
            console.log(error);
        });
	}
	//成功之后添加文件进列表
    fUploadSuccess = (data) => {
        const self = this;
        self.fLoadFileList();
    }
    fUploadDelete(data){
        const file = data;
        this.fDeleteFile(file.id).then(() => {
            this.fLoadFileList(); 
        });
    }
    fDownload(){
        const {downloadUrl} = this.props;
        //打开多个窗口，会被拦截，需要手动允许
        this.selectedFiles.forEach((item) => {
            window.open(downloadUrl + '?id=' + item.id);
        });
    }
    fDelete(){
        //后端接口未支持批量删除，暂时使用循环删除
        axios.all(this.selectedFiles.map((item) => {
            return this.fDeleteFile(item.id);
        })).then(() => {
            this.fLoadFileList();
        });
    }
    fGetSelectedData(data){
        this.selectedFiles = data;
        this.setState({
            selectedFiles: data
        })
    }
	fGetTableColumns(){
        const self = this;
        const {downloadUrl} = this.props;

		const columns = [
            { title: '', dataIndex: '', key: '', width: 50, 
              render(text, record, index) {
                return (
                  <a href={downloadUrl + '?id=' + record.id} target="_blank">
                    <Icon className="uf-cloud-down"></Icon>
                  </a>
                );
              }},
            { title: '附件名称', dataIndex: 'filename', key: 'filename', width: 200, 
                sorter:function(a,b){
                    return a.filename.localeCompare(b.filename);
                }
            },
            { title: '上传人', dataIndex: 'uploader', key: 'uploader', width: 100, 
                sorter:function(a,b){
                    return a.uploader.localeCompare(b.uploader);
                }
            },
            { title: '文件大小', dataIndex: 'filesize', key: 'filesize', width: 100, 
                sorter: function(a,b){
                    const reg = /^([\d.]+)([\w()]+)$/;
                    const matchA = a.filesize.match(reg),
                          matchB = b.filesize.match(reg);
                    if(matchA && matchB){
                        const numA = matchA[1],
                              unitA = matchA[2],
                              numB = matchB[1],
                              unitB = matchB[2];
                        if(numA && unitA && numA && unitB){
                            if(numA == numB && unitA == unitB){
                                return 0;
                            }
                            return self.fConvertFileSize(numA,unitA) > self.fConvertFileSize(numB,unitB) ? 1 : -1;
                        }
                    }
                    return 1;
                }
            },
			{ title: '文件类型', dataIndex: 'filetype', key: 'filetype', width: 100, render(text, record, index) {
                let ext = record.filetype;
                let filetypeCls = 'upload-filetype-' + ext;
                let hasIcon = self.fileTypeIcons.indexOf(ext) > -1;

                return (
                    <React.Fragment>
                        {hasIcon ? <span className={'upload-filetype ' + filetypeCls}></span> : <span>{ext}</span>}
                    </React.Fragment>
                );
              }},
            { title: '上传时间', dataIndex: 'uploadtime', key: 'uploadtime', width: 200,
                sorter:function(a,b){
                    return self.fCompareUploadTime(a,b);
                }
            }
		];

		return columns;
    }
    fConvertFileSize(numA,unitA){
        switch(unitA){
            case 'MB':
                numA = numA * 1024 * 1024;
                break;
            case 'KB':
                numA = numA * 1024;
                break;
            default:
                break;
        }

        return numA;
    }
    fCompareUploadTime(a,b){
        let aDate = +new Date(a.uploadtime),
            bDate = +new Date(b.uploadtime);
        if(aDate == bDate){
            return 0;
        }
        return aDate > bDate ? -1 : 1;
    }
	render(){
		const columns = this.fGetTableColumns();
		let {fileList,selectedFiles} = this.state;
		let {filepath,groupname,permission,url,uploadUrl,downloadUrl,fileType,fileMaxSize} = this.props;
		let uploadData = {
			filepath: filepath,
			groupname: groupname,
			permission: permission,
			url: url
        }
        // let uploadList = fileList.map(function(item){
        //     return {
        //         id: item.id,
        //         fileName: item.filename,
        //         accessAddress: downloadUrl + '?id=' + item.id
        //     }
        // });
        let tableList = fileList.map(function(item){
            const regExt = /\.(\w+)$/;
            let filetypeMatch = item.filename.match(regExt);
            let filetype = filetypeMatch ? filetypeMatch[1] : '';
            //修复table的checkbox不选中bug
            let _checked = false;
            selectedFiles.forEach((sf) => {
                if(sf.id == item.id){
                    _checked = sf._checked;
                }
            })
            return {
                ...item,
                key: item.id,
                uploader: 'todo',
                filetype: filetype,
                _checked: _checked               
            }
        });
        //数据按照上传时间倒序
        tableList.sort(this.fCompareUploadTime);
        
        let battchEnable = selectedFiles && selectedFiles.length > 0;

		return (
			<div>
				<AcUpload
					title={'附件管理'}
					action={uploadUrl}
					data={uploadData}
					// defaultFileList={uploadList}
					multiple={false}
                    isView={false}
                    accept={fileType}
                    maxSize={fileMaxSize}
					onError={(err) => alert('上传报错了')}
					onSuccess={this.fUploadSuccess}
					onDelete={this.fUploadDelete}
				>
                    <Button colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf uf-upload">上传附件</Icon>
                    </Button>
                </AcUpload>
                <Button colors="primary" disabled={!battchEnable} className="upload-btn" size='sm' onClick={this.fDownload}>
                    <Icon className="uf uf-download">下载</Icon>
                </Button>
                <Button colors="primary" disabled={!battchEnable} className="upload-btn" size='sm' onClick={this.fDelete}>
                    <Icon className="uf uf-del">删除</Icon>
                </Button>
                <MultiSelectSortTable
                    className='upload-table'
					columns={columns}
                    data={tableList}
                    multiSelect={{type:'checkbox'}}
                    getSelectedDataFunc={this.fGetSelectedData}
				/>
			</div>
		)
	}
}

AcAttachment.propTypes = propTypes;
AcAttachment.defaultProps = defaultProps;


export default AcAttachment;
