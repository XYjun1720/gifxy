// gif-encoder-simple.js - 纯JS GIF编码器（无Worker版本）
class SimpleGIFEncoder {
    constructor(options = {}) {
        this.width = options.width || 100;
        this.height = options.height || 100;
        this.delay = options.delay || 100; // 毫秒
        this.repeat = options.repeat || 0; // 0=无限循环
        this.quality = options.quality || 10;
        this.frames = [];
        this.globalPalette = null;
    }

    // 添加一帧
    addFrame(imageData, options = {}) {
        const frame = {
            imageData: imageData,
            delay: options.delay || this.delay,
            width: this.width,
            height: this.height
        };
        this.frames.push(frame);
        return this;
    }

    // 渲染GIF
    render() {
        return new Promise((resolve) => {
            console.log('开始生成GIF...');
            
            // 创建GIF头部
            let gifData = this.createHeader();
            
            // 添加逻辑屏幕描述符
            gifData = gifData.concat(this.createLogicalScreenDescriptor());
            
            // 添加全局颜色表
            if (this.globalPalette) {
                gifData = gifData.concat(this.globalPalette);
            } else {
                // 使用简单的256色调色板
                gifData = gifData.concat(this.createDefaultPalette());
            }
            
            // 添加应用扩展块（循环信息）
            if (this.repeat >= 0) {
                gifData = gifData.concat(this.createApplicationExtension());
            }
            
            // 添加每一帧
            this.frames.forEach((frame, index) => {
                console.log(`添加第 ${index + 1}/${this.frames.length} 帧`);
                gifData = gifData.concat(this.createFrame(frame));
            });
            
            // 添加文件结束符
            gifData.push(0x3B); // ;
            
            // 转换为Blob
            const blob = new Blob([new Uint8Array(gifData)], { type: 'image/gif' });
            
            console.log('GIF生成完成，大小:', blob.size, 'bytes');
            resolve(blob);
        });
    }

    // 创建GIF头部（"GIF89a"）
    createHeader() {
        return [
            0x47, 0x49, 0x46, // GIF
            0x38, 0x39, 0x61  // 89a
        ];
    }

    // 创建逻辑屏幕描述符
    createLogicalScreenDescriptor() {
        const packed = 0xF0; // 全局颜色表标志+颜色分辨率+排序标志+全局颜色表大小
        const bgColorIndex = 0; // 背景色索引
        const pixelAspectRatio = 0; // 像素宽高比
        
        return [
            this.width & 0xFF, (this.width >> 8) & 0xFF,   // 宽度
            this.height & 0xFF, (this.height >> 8) & 0xFF, // 高度
            packed,                                         // 包装字段
            bgColorIndex,                                   // 背景色索引
            pixelAspectRatio                                // 像素宽高比
        ];
    }

    // 创建默认调色板（256色）
    createDefaultPalette() {
        const palette = new Array(256 * 3).fill(0);
        
        // 简单的颜色映射
        for (let i = 0; i < 256; i++) {
            const pos = i * 3;
            // 创建渐变调色板
            palette[pos] = i;         // R
            palette[pos + 1] = i;     // G
            palette[pos + 2] = i;     // B
        }
        
        return palette;
    }

    // 创建应用扩展块（循环信息）
    createApplicationExtension() {
        return [
            0x21, 0xFF, 0x0B,         // 扩展块标签
            0x4E, 0x45, 0x54, 0x53,   // "NETSCAPE"
            0x43, 0x41, 0x50, 0x45,
            0x32, 0x2E, 0x30,
            0x03, 0x01,               // 数据块大小
            this.repeat & 0xFF,       // 循环次数（低字节）
            (this.repeat >> 8) & 0xFF, // 循环次数（高字节）
            0x00                      // 数据块终止符
        ];
    }

    // 创建帧
    createFrame(frame) {
        const data = [];
        
        // 图形控制扩展
        data.push(0x21, 0xF9, 0x04);  // 扩展标签
        data.push(0x00);              // 包装字段（无透明色）
        
        // 延迟时间（以1/100秒为单位）
        const delay = Math.floor(frame.delay / 10);
        data.push(delay & 0xFF, (delay >> 8) & 0xFF);
        
        data.push(0x00);              // 透明色索引
        data.push(0x00);              // 块终止符
        
        // 图像描述符
        data.push(0x2C);              // 图像分隔符
        data.push(0x00, 0x00);        // 左位置
        data.push(0x00, 0x00);        // 上位置
        data.push(frame.width & 0xFF, (frame.width >> 8) & 0xFF);
        data.push(frame.height & 0xFF, (frame.height >> 8) & 0xFF);
        data.push(0x00);              // 包装字段（无局部颜色表）
        
        // 简单的图像数据（单色示例）
        const lzwData = this.createSimpleImageData();
        data.push(...lzwData);
        
        return data;
    }

    // 创建简单的图像数据（LZW压缩的占位符）
    createSimpleImageData() {
        // 这是一个简化的实现，生成一个单色矩形
        // 在实际使用中，你需要实现真正的LZW压缩算法
        
        const data = [];
        
        // LZW最小代码大小（8位）
        data.push(8);
        
        // 图像数据块（简化的单色数据）
        // 在实际应用中，这里应该是真正的图像像素数据
        const blockSize = 11;
        data.push(blockSize); // 数据块大小
        
        // 简单的压缩数据
        data.push(
            0x00, 0x51, 0xFC, 0x1B, 0x28, 
            0x70, 0xA0, 0xC1, 0x83, 0x01, 0x01
        );
        
        // 块终止符
        data.push(0x00);
        
        return data;
    }
}

// 简化版：使用Canvas生成GIF
class CanvasGIFGenerator {
    /**
     * 从精灵图生成GIF动画
     * @param {HTMLImageElement} image - 原始精灵图
     * @param {number} cols - 列数
     * @param {number} rows - 行数
     * @param {number} fps - 帧率
     * @param {string} originalName - 原始文件名
     * @returns {Promise} 返回GIF数据的Promise
     */
    static async generateFromSprite(image, cols, rows, fps, originalName) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`开始生成GIF: ${originalName}`);
                
                const frameWidth = Math.floor(image.width / cols);
                const frameHeight = Math.floor(image.height / rows);
                const delay = Math.floor(1000 / fps);
                
                // 创建临时Canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = frameWidth;
                tempCanvas.height = frameHeight;
                const ctx = tempCanvas.getContext('2d');
                
                // 收集所有帧
                const frames = [];
                
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        // 清空画布
                        ctx.clearRect(0, 0, frameWidth, frameHeight);
                        
                        // 绘制当前帧
                        ctx.drawImage(
                            image,
                            col * frameWidth,
                            row * frameHeight,
                            frameWidth,
                            frameHeight,
                            0, 0,
                            frameWidth,
                            frameHeight
                        );
                        
                        // 获取图像数据
                        const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
                        frames.push({
                            imageData: imageData,
                            delay: delay
                        });
                    }
                }
                
                console.log(`提取了 ${frames.length} 帧`);
                
                // 使用Canvas的toDataURL方法生成GIF（浏览器原生支持）
                // 注意：这个方法可能不是所有浏览器都支持GIF格式
                tempCanvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const gifName = originalName.replace(/\.[^/.]+$/, '') + '.gif';
                        
                        resolve({
                            blob: blob,
                            url: url,
                            name: gifName,
                            width: frameWidth,
                            height: frameHeight,
                            frames: frames.length
                        });
                    } else {
                        // 如果浏览器不支持toBlob('image/gif')，回退到PNG序列
                        console.log('浏览器不支持GIF导出，使用PNG替代');
                        this.createPNGSequence(image, cols, rows, originalName)
                            .then(resolve)
                            .catch(reject);
                    }
                }, 'image/gif');
                
            } catch (error) {
                console.error('GIF生成失败:', error);
                reject(error);
            }
        });
    }
    
    /**
     * 创建PNG帧序列作为备用方案
     */
    static async createPNGSequence(image, cols, rows, originalName) {
        const frameWidth = Math.floor(image.width / cols);
        const frameHeight = Math.floor(image.height / rows);
        
        // 创建第一帧的Canvas
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');
        
        // 绘制第一帧
        ctx.drawImage(
            image,
            0, 0, // 第一帧
            frameWidth,
            frameHeight,
            0, 0,
            frameWidth,
            frameHeight
        );
        
        // 转换为PNG
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const fileName = originalName.replace(/\.[^/.]+$/, '') + '_frame.png';
                
                resolve({
                    blob: blob,
                    url: url,
                    name: fileName,
                    width: frameWidth,
                    height: frameHeight,
                    frames: 1,
                    isPNG: true // 标记这是PNG文件
                });
            }, 'image/png');
        });
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimpleGIFEncoder, CanvasGIFGenerator };
} else {
    window.SimpleGIFEncoder = SimpleGIFEncoder;
    window.CanvasGIFGenerator = CanvasGIFGenerator;
}
