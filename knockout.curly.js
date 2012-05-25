{
    function ReplaceNodeWithNodes(pToReplace, pReplacements) {
        var parent = pToReplace.parentNode;

        for (var i = 0; i < pReplacements.length; i++) {
            parent.insertBefore(pReplacements[i], pToReplace);
        }

        parent.removeChild(pToReplace);
    }

    function VisitNodes(pNode, pfAction) {
        pfAction(pNode);
        if (pNode.childNodes) {
            for (var i = 0; i < pNode.childNodes.length; i++) {
                VisitNodes(pNode.childNodes[i], pfAction);
            }
        }
    }

    function ApplyKoBracketBinding(pNode) {
        var Node = (pNode != null) ? pNode : document.body;
        var ReplacementInfos = [];

        VisitNodes(Node, function (node) {
            if (node.nodeType != 3) return;
            if (node.parentNode != null && node.parentNode.nodeName == "SCRIPT") return;

            var ReplacementInfo = ReplaceMatches(node, /{{(.*?)}}/, function (Matches) {
                var Name = Matches[1];
                var node = document.createElement("span");
                node.setAttribute("data-bind", "text:" + Name);
                return node;
            });

            if (ReplacementInfo != null) {
                ReplacementInfos.push(ReplacementInfo);
            }
        });

        for (var i = 0; i < ReplacementInfos.length; i++) {
            var ReplacementInfo = ReplacementInfos[i];
            ReplaceNodeWithNodes(ReplacementInfo.ToReplace, ReplacementInfo.Replacements);
        }
    }

    function GetText(node) {
        if (node.textContent) return node.textContent;
        return node.nodeValue;
    }

    function ReplaceMatches(pTestNode, pRegEx, pfReplacementNode) {
        if (pTestNode.nodeType != 3) throw "This only works on text nodes";
        var parent = pTestNode.parentNode;

        var Text = GetText(pTestNode);

        var NewNodes = [];
        var RemainingText = Text;
        while (true) {
            var IndexOfMatch = RemainingText.search(pRegEx);
            if (IndexOfMatch == -1) break;

            var Matches = RemainingText.match(pRegEx);

            if (IndexOfMatch != 0) {
                var BeforePlaceholder = RemainingText.substring(0, IndexOfMatch);
                NewNodes.push(document.createTextNode(BeforePlaceholder));
            }

            NewNodes.push(pfReplacementNode(Matches));

            RemainingText = RemainingText.substring(IndexOfMatch + Matches[0].length);
        }

        if (NewNodes.length == 0) return null;

        if (RemainingText.length > 0) {
            NewNodes.push(document.createTextNode(RemainingText));
        }

        return { ToReplace: pTestNode, Replacements: NewNodes };
    }

    var OriginalApplyBindings = ko.applyBindings;
    ko.applyBindings = function (pModel, pNode) {
        var Node = (pNode != null) ? pNode : document.body;
        ApplyKoBracketBinding(Node);
        OriginalApplyBindings(pModel, pNode);
    };
}