#!/bin/bash
## name:ZSH 安装脚本 v3.0
## author:Maple
## version:3.0
## github:#



# --- 颜色与符号 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'
CHECK="✔"

echo -e "${PURPLE}-----------------------------------------"
echo -e "   ZSH Installer v3.0 | Made With Maple"
echo -e "-----------------------------------------${NC}"

# 1. 环境预检
[ ! -f /etc/debian_version ] && echo -e "${RED}错误: 仅支持 Debian 系系统${NC}" && exit 1
SUDO=$(command -v sudo)

# 2. 网络诊断与镜像选择
echo -e "\n${BLUE}[1/8] 正在诊断 GitHub 连通性... 请稍等...${NC}"
GITHUB_URL="https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/README.md"
MIRROR_PREFIX=""
if ! curl -I --connect-timeout 5 "$GITHUB_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}检测到直连困难，已启用镜像加速模式。${NC}"
    MIRROR_PREFIX="https://ghfast.top/" # 默认使用稳定性较好的镜像
fi

# 3. 安装核心依赖
echo -e "\n${BLUE}[2/8] 安装基础组件...${NC}"
$SUDO apt update && $SUDO apt install -y zsh git curl wget fontconfig locales
$SUDO locale-gen en_US.UTF-8

# 4. 字体安装逻辑 (针对桌面用户优化)
install_fonts_logic() {
    echo -e "\n${BLUE}[3/8] 字体增强配置${NC}"
    # 检测桌面环境
    IS_DESKTOP=false
    if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
        IS_DESKTOP=true
    fi

    if [ "$IS_DESKTOP" = true ] || [[ "$THEME" == *"powerlevel10k"* ]] || [[ "$THEME" == "agnoster" ]]; then
        echo -e "${YELLOW}您选择了高级主题或处于桌面环境，建议安装 Nerd Fonts 以避免乱码。${NC}"
        read -p "是否安装 JetBrainsMono Nerd Font? (y/n) [y]: " confirm_font
        if [[ "$confirm_font" != "n" ]]; then
            FONT_DIR="$HOME/.local/share/fonts"
            mkdir -p "$FONT_DIR"
            
            # 定义字体下载地址 (使用镜像)
            FONT_URL="${MIRROR_PREFIX}https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip"
            
            echo -e "${YELLOW}正在下载字体包 (约 30MB)，请稍候...${NC}"
            wget -q --show-progress -O /tmp/jb_font.zip "$FONT_URL"
            
            if [ $? -eq 0 ]; then
                $SUDO apt install -y unzip > /dev/null
                unzip -o /tmp/jb_font.zip -d "$FONT_DIR" > /dev/null
                fc-cache -fv > /dev/null
                echo -e "${GREEN}${CHECK} 字体已安装至 $FONT_DIR 并刷新缓存。${NC}"
                echo -e "${BLUE}请记得在终端设置中手动将字体改为 'JetBrainsMono Nerd Font'。${NC}"
            else
                echo -e "${RED}字体下载失败，跳过此步骤。${NC}"
            fi
            rm -f /tmp/jb_font.zip
        fi
    fi

    if [ "$IS_DESKTOP" = false ]; then
        echo -e "${YELLOW}非桌面环境，跳过字体安装。${NC}"
    fi
}

# 5. 安装 Oh My Zsh
echo -e "\n${BLUE}[4/8] 安装 Oh My Zsh 框架...${NC}"
if [ -d "$HOME/.oh-my-zsh" ]; then
    echo -e "${YELLOW}已检测到 Oh My Zsh，跳过克隆。${NC}"
else
    curl -fsSL "${MIRROR_PREFIX}https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh" > install_omz.sh
    sed -i "s|https://github.com/|${MIRROR_PREFIX}https://github.com/|g" install_omz.sh
    sh install_omz.sh --unattended --keep-zshrc
    rm install_omz.sh
fi

# 6. 主题选择
echo -e "\n${BLUE}[5/8] 配置视觉主题${NC}"
echo "1) powerlevel10k (现代全能, 强烈推荐)"
echo "2) robbyrussell  (默认, 极简)"
echo "3) agnoster      (经典美观, 需字体支持)"
echo "4) ys            (信息全面)"
read -p "选择主题编号 [默认 1]: " t_c
case $t_c in
    2) THEME="robbyrussell" ;;
    3) THEME="agnoster" ;;
    4) THEME="ys" ;;
    *) THEME="powerlevel10k/powerlevel10k"
       git clone --depth=1 "${MIRROR_PREFIX}https://github.com/romkatv/powerlevel10k.git" ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k ;;
esac

# 运行字体安装逻辑
install_fonts_logic

# 7. 插件安装
echo -e "\n${BLUE}[6/8] 正在处理 Oh My Zsh 插件...${NC}"
ZSH_CUSTOM=${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}
echo -e "${YELLOW}提示: 以下插件将被启用:${NC}"
echo -e "如需修改，请编辑 ~/.zshrc 中的 plugins 行。"
PLUGINS_LIST="git zsh-autosuggestions zsh-syntax-highlighting sudo extract colored-man-pages"

# 克隆三方插件
echo -e "${YELLOW}提示: 正在安装 zsh-autosuggestions 和 zsh-syntax-highlighting 插件...${NC}"
git clone "${MIRROR_PREFIX}https://github.com/zsh-users/zsh-autosuggestions" "$ZSH_CUSTOM/plugins/zsh-autosuggestions" --quiet
git clone "${MIRROR_PREFIX}https://github.com/zsh-users/zsh-syntax-highlighting" "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" --quiet

# 8. 写入配置
echo -e "\n${BLUE}[7/8] 同步 .zshrc 配置...${NC}"
[ -f ~/.zshrc ] && cp ~/.zshrc ~/.zshrc.bak
sed -i "s/^ZSH_THEME=.*/ZSH_THEME=\"$THEME\"/" ~/.zshrc
sed -i "s/^plugins=(.*)/plugins=($PLUGINS_LIST)/" ~/.zshrc

# 9. 结束
echo -e "\n${BLUE}[8/8] 权限设置${NC}"
read -p "是否设为默认 Shell? (y/n) [y]: " confirm_chsh
if [[ "$confirm_chsh" != "n" ]]; then
    $SUDO chsh -s $(which zsh) $(whoami)
fi

echo -e "\n${GREEN}✨ 配置完成！${NC}"
echo -e "1. 输入 ${YELLOW}zsh${NC} 立即体验。"
echo -e "2. 如果是桌面终端，请务必在设置中修改字体为 ${BLUE}JetBrainsMono Nerd Font${NC}。"