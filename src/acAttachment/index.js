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
import Popconfirm from 'bee-popconfirm';
import Icon from 'bee-icon';
import axios from 'axios';
import './index.scss';

let MultiSelectSortTable  = multiSelect(sort(Table, Icon), Checkbox);

const propTypes = {
	recordId: PropTypes.string,
    groupname: PropTypes.string,
    permission: PropTypes.oneOf(['read','private','full']),
    tenant: PropTypes.string,
    url: PropTypes.bool,
    baseUrl: PropTypes.string,
	uploadUrl: PropTypes.string,
	queryUrl: PropTypes.string,
	deleteUrl: PropTypes.string,
    downloadUrl: PropTypes.string,
    fileType: PropTypes.string,
    fileMaxSize: PropTypes.number,
    deleteConfirm: PropTypes.bool,
    className: PropTypes.string
}

const defaultProps = {
    baseUrl: '',
	uploadUrl: '/iuap-saas-filesystem-service/file/upload',
	queryUrl: '/iuap-saas-filesystem-service/file/query',
	deleteUrl: '/iuap-saas-filesystem-service/file/delete',
    downloadUrl: '/iuap-saas-filesystem-service/file/download',
    batchDeleteUrl: '/iuap-saas-filesystem-service/file/batchDeleteByIds',
    fileMaxSize: 10 * 1024 * 1024, //默认10M
    deleteConfirm: true
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
                      'fDownload','fDelete','fGetSelectedData','fConClick']);
    }
    get uploadUrl(){
        return `${this.props.baseUrl}${this.props.uploadUrl}`;
    }
    get queryUrl(){
        return `${this.props.baseUrl}${this.props.queryUrl}`;
    }
    get deleteUrl(){
        return `${this.props.baseUrl}${this.props.deleteUrl}`;
    }
    get downloadUrl(){
        return `${this.props.baseUrl}${this.props.downloadUrl}`;
    }
    get batchDeleteUrl(){
        return `${this.props.baseUrl}${this.props.batchDeleteUrl}`;
    }
	componentDidMount(){
		this.fLoadFileList();
	}
	fLoadFileList(){
        const self = this;
        const {recordId,groupname,tenant} = self.props;
        const params = {
            filepath: recordId,
            groupname: groupname,
        }
        if(tenant){
            params['tenant'] = tenant;
        }

        return axios({
            url: self.queryUrl,
            params: params
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

        return axios({
            url: self.deleteUrl,
            params: {
                id: id
            }
        }).then(function(res){
            return res;
        }).catch(function (error) {
            console.log(error);
        });
    }
    fBatchDeleteFiles(ids){
        const self = this;
        if(Array.isArray(ids)){
            ids = ids.join(',');
        }

        return axios({
            url: self.batchDeleteUrl,
            params: {
                ids: ids
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
        const downloadUrl = this.downloadUrl;
        //打开多个窗口，会被拦截，需要手动允许
        this.selectedFiles.forEach((item) => {
            window.open(downloadUrl + '?id=' + item.id);
        });
    }
    fDelete(){
        const ids = this.selectedFiles.map((item) => item.id);
        this.fBatchDeleteFiles(ids).then(() => {
            this.fLoadFileList();
            this.setState({
                selectedFiles: []
            })
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
        const downloadUrl = self.downloadUrl;

		const columns = [
            { title: '', dataIndex: '', key: '', width: 50, 
              render(text, record, index) {
                return (
                  <a href={downloadUrl + '?id=' + record.id} target="_blank">
                    <Icon className="uf-cloud-down"></Icon>
                  </a>
                );
              }
            },
            { title: '附件名称', dataIndex: 'filename', key: 'filename', width: 200, 
                sorter:function(a,b){
                    return a.filename.localeCompare(b.filename);
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
            { title: '上传人', dataIndex: 'uploader', key: 'uploader', width: 100, 
                sorter:function(a,b){
                    return a.uploader.localeCompare(b.uploader);
                }
            },
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
    fGetBtnByProp(prop){
        const {children} = this.props;
        let btn = null;
        if(children){
            React.Children.forEach(children,function(item){
                if(item.props['data-btn'] == prop){
                    btn = item;
                }
            });
        }
        return btn;
    }
    fGetBtnByType(type,disabled){
        let btn = this.fGetBtnByProp(type);
        if(!btn){
            let map = {
                'upload':  (
                    <Button data-btn="upload" colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf-upload"></Icon>上传
                    </Button>
                ),
                'download': (
                    <Button data-btn="download" colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf-download"></Icon>下载
                    </Button>
                ),
                'delete': (
                    <Button data-btn="delete" colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf-del"></Icon>删除
                    </Button>
                )
            };
            btn = map[type];
        }
        
        if(type != 'upload'){
            btn = React.cloneElement(btn,{disabled:disabled});
        }
        if(type == 'delete'){
            btn = this.renderDel(btn);
        }

        return btn;
    }
    fConClick(ev){
        const dataBtn = ev.target.getAttribute('data-btn');

        switch(dataBtn){
            case 'download':
                this.fDownload();
                break;
            case 'delete':
                if(!this.props.deleteConfirm){
                    this.fDelete();
                }
                break;
            default:
                break;
        }
    }
    renderDel(btn){
        let {deleteConfirm} = this.props;
        return (
            deleteConfirm ? 
                (<Popconfirm trigger="click" placement="bottom" content={'确定要删除吗？'} onClose={this.fDelete}>
                    {btn}
                </Popconfirm>)
                :
                ({btn})
        )
    }
	render(){
		const columns = this.fGetTableColumns();
        let {fileList,selectedFiles} = this.state;
        fileList = fileList || [];
        selectedFiles = selectedFiles || [];

        let {recordId,groupname,permission,url,fileType,fileMaxSize,className} = this.props;
        
		let uploadData = {
			filepath: recordId,
			groupname: groupname
        };
        if(permission){
            uploadData['permission'] = permission;
        }
        if(url){
            uploadData['url'] = url;
        }

        let uploadUrl = this.uploadUrl;
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
                uploader: '',
                filetype: filetype,
                _checked: _checked               
            }
        });
        //数据按照上传时间倒序
        tableList.sort(this.fCompareUploadTime);
        
        //按钮禁用
        let battchEnable = selectedFiles && selectedFiles.length > 0;
        let btnDisabled = !battchEnable;
        //获取按钮
        let btnUpload = this.fGetBtnByType('upload',btnDisabled);
        let btnDownload = this.fGetBtnByType('download',btnDisabled);
        let btnDelete = this.fGetBtnByType('delete',btnDisabled);

		return (
			<div className={className} onClick={this.fConClick}>
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
                    {btnUpload}
                </AcUpload>
                {btnDownload}
                {btnDelete}
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
